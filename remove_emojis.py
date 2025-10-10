import re

# Read the file
with open('src/main.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove all emoji characters (Unicode ranges for various emoji blocks)
# This matches most common emojis
emoji_pattern = re.compile("["
        u"\U0001F600-\U0001F64F"  # emoticons
        u"\U0001F300-\U0001F5FF"  # symbols & pictographs
        u"\U0001F680-\U0001F6FF"  # transport & map symbols
        u"\U0001F1E0-\U0001F1FF"  # flags (iOS)
        u"\U00002500-\U00002BEF"  # chinese char
        u"\U00002702-\U000027B0"
        u"\U00002702-\U000027B0"
        u"\U000024C2-\U0001F251"
        u"\U0001f926-\U0001f937"
        u"\U00010000-\U0010ffff"
        u"\u2640-\u2642" 
        u"\u2600-\u2B55"
        u"\u200d"
        u"\u23cf"
        u"\u23e9"
        u"\u231a"
        u"\ufe0f"  # dingbats
        u"\u3030"
                      "]+", flags=re.UNICODE)

content = emoji_pattern.sub('', content)

# Also remove any extra spaces that might be left
content = re.sub(r'  +', ' ', content)  # Replace multiple spaces with single space

# Write back
with open('src/main.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('✓ Emojis removed from src/main.js')
