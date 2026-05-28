import os
import json
import requests

# Grab the secure API key from GitHub Secrets
API_KEY = os.environ.get("GEMINI_API_KEY")
URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={API_KEY}"

# The exact prompt with the official PL-300 syllabus and weighting
prompt = """
Generate 20 advanced PL-300 practice questions. 
Distribute the questions strictly according to these four exact domains and their exam weights:

1. "Prepare the data" (Approx 5-6 questions) - Topics: Get/connect to data, Profile and clean data, Transform and load data.
2. "Model the data" (Approx 5-6 questions) - Topics: Design data model, Create model calculations (DAX), Optimize model performance.
3. "Visualize and analyze the data" (Approx 5-6 questions) - Topics: Create reports, Enhance usability and storytelling, Identify patterns and trends.
4. "Manage and secure Power BI" (Approx 3-4 questions) - Topics: Manage workspaces and assets, Secure and govern items.

Do not use markdown formatting like ```json in the output. Return ONLY a raw, valid JSON object with the following exact schema. 
Ensure the "domain" field uses EXACTLY the four domain names listed above in quotes.

{
  "pl300_questions": [
    {
      "id": "q_random_number",
      "domain": "Exact Domain Name",
      "topic": "Specific Topic (e.g., Row-level security, DAX CALCULATE, etc.)",
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

print("Fetching new comprehensive PL-300 questions from Gemini...")
response = requests.post(URL, json=payload, headers=headers)
data = response.json()

try:
    # Extract the text response
    raw_text = data['candidates'][0]['content']['parts'][0]['text']
    
    # Clean up any potential markdown formatting the AI might add
    raw_text = raw_text.replace('```json\n', '').replace('```', '').strip()
    
    # Parse it to ensure it is valid JSON
    new_questions = json.loads(raw_text)
    
    # Overwrite the existing questions.json file
    with open('questions.json', 'w', encoding='utf-8') as f:
        json.dump(new_questions, f, indent=4)
        
    print("Successfully updated questions.json with the full syllabus!")
    
except Exception as e:
    print(f"Error parsing JSON or updating file: {e}")
    print(f"Raw API Response: {data}")
