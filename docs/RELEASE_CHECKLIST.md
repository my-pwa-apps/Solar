# Space Voyage Release Checklist

Record this checklist in the release pull request or release notes. Browser automation
does not emulate headset compositor, controller, haptic or sustained-session behavior.

## Automated Gates

- [ ] `npm run verify` passes.
- [ ] Chromium desktop and mobile performance budgets pass.
- [ ] Firefox and WebKit compatibility smoke tests pass.
- [ ] `npm audit --audit-level=high` reports no high-severity vulnerabilities.

## Meta Quest Browser

- [ ] Record headset model, Quest OS version and browser version.
- [ ] Enter and exit immersive VR three times without a black frame or stale session.
- [ ] Confirm left-stick movement, right-stick turn/elevation and trigger sprint.
- [ ] Confirm X toggles the menu and both grips perform their documented actions.
- [ ] Navigate to a planet, moon, spacecraft and deep-space object.
- [ ] Confirm the menu remains at eye level, can be dragged and stays vertically billboarded.
- [ ] Confirm controller rays, selection and haptics target the correct hand.
- [ ] Run for 15 minutes and record any frame-rate degradation, heat warning or memory failure.
- [ ] Test offline relaunch after one complete online load.

## Release Record

- Release/version:
- Date:
- Tester:
- Device and software versions:
- Automated run URL:
- Result and known exceptions: