import os
import json
import requests

# 1. Grab the secure API key from GitHub Secrets
API_KEY = os.environ.get("GEMINI_API_KEY")
URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={API_KEY}"

# 2. Define the exact prompt and JSON schema we want back
prompt = """
Generate 10 advanced PL-300 practice questions covering the exam domains. 
Do not use markdown formatting like ```json in the output. Return ONLY a raw, valid JSON object with the following exact schema:
{
  "pl300_questions": [
    {
      "id": "q_random_number",
      "domain": "Domain Name",
      "topic": "Specific Topic",
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "Correct Option Text",
      "rationale": "Why it is correct"
    }
  ]
}
"""

payload = {
    "contents": [{"parts": [{"text": prompt}]}]
}

headers = {"Content-Type": "application/json"}

# 3. Call the API
print("Fetching new questions from Gemini...")
response = requests.post(URL, json=payload, headers=headers)
data = response.json()

try:
    # 4. Extract the text response
    raw_text = data['candidates'][0]['content']['parts'][0]['text']
    
    # Clean up any potential markdown formatting the AI might add
    raw_text = raw_text.replace('```json\n', '').replace('```', '').strip()
    
    # 5. Parse it to ensure it is valid JSON
    new_questions = json.loads(raw_text)
    
    # 6. Overwrite the existing questions.json file
    with open('questions.json', 'w', encoding='utf-8') as f:
        json.dump(new_questions, f, indent=4)
        
    print("Successfully updated questions.json!")
    
except Exception as e:
    print(f"Error parsing JSON or updating file: {e}")
    print(f"Raw API Response: {data}")
