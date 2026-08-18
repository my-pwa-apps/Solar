/**
 * EclipseRenderer — draws the Moon's umbra and penumbra onto the Earth mesh.
 *
 * Why this is not done with shadow maps: the scene draws the Moon at ~4 Earth
 * radii instead of the true ~60, and a 1024px shadow map spanning the solar
 * system cannot resolve a ~100 km umbra on a 12,742 km globe. Instead the
 * shadow is computed analytically in real kilometres by `Eclipse.js` and
 * projected onto Earth's surface in a shader.
 *
 * The shader works in Earth's *object* space, so the shadow stays locked to the
 * correct geographic location regardless of how the mesh is oriented in world
 * space by axial tilt or self-rotation.
 */

import { solarEclipseAt } from './Eclipse.js';
import { EARTH_RADIUS_KM, gmst } from './Ephemeris.js';

const DEG = Math.PI / 180;

/**
 * Rotate a geocentric equatorial vector into Earth-object space.
 *
 * Derived from the equirectangular UV convention of THREE.SphereGeometry: a
 * surface point at (lat, lon) sits at (cos_lat*cos_lon, sin_lat, -cos_lat*sin_lon).
 * Composing that with `lon = ra - gmst` collapses to this linear map, which is
 * therefore valid for any vector, not just surface points.
 */
function equatorialToObject(v, g) {
    const cosG = Math.cos(g);
    const sinG = Math.sin(g);
    return {
        x: v.x * cosG + v.y * sinG,
        y: v.z,
        z: v.x * sinG - v.y * cosG
    };
}

export class EclipseRenderer {
    constructor(THREE) {
        this.THREE = THREE;
        this.uniforms = null;
        this.material = null;
        this.lastState = null;
        this._enabled = true;
    }

    /**
     * Patch Earth's material so it can draw an eclipse shadow. Safe to call
     * once per material; repeated calls on the same material are ignored.
     */
    attach(earthMesh) {
        if (!earthMesh || !earthMesh.material) return false;
        const material = earthMesh.material;

        // Recover the existing uniforms rather than returning a renderer that
        // looks attached but can never push a value.
        if (material.userData && material.userData.__eclipseUniforms) {
            this.uniforms = material.userData.__eclipseUniforms;
            this.material = material;
            return true;
        }

        const uniforms = {
            uEclipseIntensity: { value: 0 },
            uAxisPoint: { value: new this.THREE.Vector3() },
            uAxisDir: { value: new this.THREE.Vector3(0, 0, 1) },
            uSunDirObj: { value: new this.THREE.Vector3(1, 0, 0) },
            uUmbraKm: { value: 0 },
            uPenumbraKm: { value: 1 },
            uEarthRadiusKm: { value: EARTH_RADIUS_KM }
        };

        material.onBeforeCompile = (shader) => {
            Object.assign(shader.uniforms, uniforms);

            shader.vertexShader = shader.vertexShader
                .replace(
                    '#include <common>',
                    '#include <common>\nvarying vec3 vEclipseObj;'
                )
                .replace(
                    '#include <begin_vertex>',
                    '#include <begin_vertex>\nvEclipseObj = position;'
                );

            shader.fragmentShader = shader.fragmentShader
                .replace(
                    '#include <common>',
                    `#include <common>
varying vec3 vEclipseObj;
uniform float uEclipseIntensity;
uniform vec3 uAxisPoint;
uniform vec3 uAxisDir;
uniform vec3 uSunDirObj;
uniform float uUmbraKm;
uniform float uPenumbraKm;
uniform float uEarthRadiusKm;`
                )
                .replace(
                    '#include <dithering_fragment>',
                    `#include <dithering_fragment>
if (uEclipseIntensity > 0.0) {
    vec3 nrm = normalize(vEclipseObj);
    // Only the sunlit hemisphere can be eclipsed, but the umbra legitimately
    // reaches the terminator during a sunrise or sunset eclipse, so the fade
    // is kept narrow and centred on it.
    float day = smoothstep(-0.04, 0.02, dot(nrm, uSunDirObj));
    if (day > 0.0) {
        vec3 p = nrm * uEarthRadiusKm;
        vec3 v = p - uAxisPoint;
        float t = dot(v, uAxisDir);
        // Perpendicular distance to the shadow axis. Using the true 3D axis
        // rather than an angular radius makes the footprint correctly
        // elliptical at oblique incidence.
        float perp = length(v - t * uAxisDir);
        float f = 1.0 - smoothstep(uUmbraKm, uPenumbraKm, perp);
        // Daylight falls off very little until the Sun is nearly covered, so a
        // steep curve is both closer to the physics and stops the wide
        // penumbra reading as a grey smear across half the globe.
        float shade = pow(f, 4.0) * day * uEclipseIntensity;
        gl_FragColor.rgb *= mix(1.0, 0.03, shade);
    }
}`
                );
        };

        material.needsUpdate = true;
        material.userData = material.userData || {};
        material.userData.__eclipseUniforms = uniforms;

        this.uniforms = uniforms;
        this.material = material;
        return true;
    }

    /** Turn shadow drawing on or off without detaching the shader. */
    setEnabled(enabled) {
        this._enabled = !!enabled;
        if (!this._enabled && this.uniforms) {
            this.uniforms.uEclipseIntensity.value = 0;
        }
    }

    /**
     * Recompute the shadow for a Julian Day and push it to the shader.
     * @returns {object|null} the eclipse state, or null when nothing is drawn
     */
    update(jd) {
        if (!this.uniforms) return null;
        if (!this._enabled) return null;

        const eclipse = solarEclipseAt(jd);

        // Only a central eclipse puts a real umbra on the globe. Partial-only
        // events are left undrawn: their penumbra covers a whole hemisphere and
        // dimming it would look like a rendering fault rather than an eclipse.
        if (!eclipse.isEclipse || eclipse.umbraRadiusKm <= 0 || !eclipse.shadowPoint) {
            this.uniforms.uEclipseIntensity.value = 0;
            this.lastState = eclipse;
            return eclipse;
        }

        const g = gmst(jd);
        const axisPoint = equatorialToObject(eclipse.shadowPoint, g);
        const axisDir = equatorialToObject(eclipse.shadowAxis, g);
        const sunDir = equatorialToObject(eclipse.sun, g);

        this.uniforms.uAxisPoint.value.set(axisPoint.x, axisPoint.y, axisPoint.z);
        this.uniforms.uAxisDir.value.set(axisDir.x, axisDir.y, axisDir.z).normalize();
        this.uniforms.uSunDirObj.value.set(sunDir.x, sunDir.y, sunDir.z).normalize();
        this.uniforms.uUmbraKm.value = eclipse.umbraRadiusKm;
        this.uniforms.uPenumbraKm.value = eclipse.penumbraRadiusKm;
        this.uniforms.uEclipseIntensity.value = 1;

        this.lastState = eclipse;
        return eclipse;
    }

    /** Object-space direction of a geographic point, for tests and markers. */
    static geoToObject(latDeg, lonDeg) {
        const lat = latDeg * DEG;
        const lon = lonDeg * DEG;
        return {
            x: Math.cos(lat) * Math.cos(lon),
            y: Math.sin(lat),
            z: -Math.cos(lat) * Math.sin(lon)
        };
    }
}
