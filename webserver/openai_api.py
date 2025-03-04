from openai import OpenAI
import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

OPENAI_API_KEY: str = os.getenv('OPENAI_API_KEY')

if OPENAI_API_KEY:
    client = OpenAI(api_key=OPENAI_API_KEY)
else:
    client = None
    print("Warning: OPENAI_API_KEY is not set. API requests will not work.")

def getSuggestion(prompt, system_messages=[], model="gpt-4o-mini", temperature=0.2, top_p=1, max_tokens = 256):
    """
    Completes a code suggestion using OpenAI's API and ChatGPT.

    Args:
        prompt (str): The prompt (or piece of code) to have a suggestion generated from.
        system_messages (list): List of system messages to be sent to API.
        model (str): The model that will be used.
        temperature (float): Temperature value used for generation.
        top_p (float): Top P value used for generation.
        max_tokens (int): Maximum number of tokens for length of response.
        
    Returns:
        str: The generated suggestion.

    Raises:
        Exception: If there is an error generating a suggestion.
    """
    try:
        messages = []
        # Append all system instructions to a list to be sent to API
        for i in system_messages:
            messages.append({"role": "system", "content": i})
        messages.append({"role": "user","content": prompt})
        
        completion = client.chat.completions.create(
            temperature=temperature,
            top_p=top_p,
            max_tokens=max_tokens,
            model=model,
            messages=messages
        )
        return ({"suggestions": completion.choices[0].message.content, "status": 200})
    except Exception as e:
        print(f"Error generating suggestion using OpenAI's API: {e}")
        return {"error", str(e)}, 500