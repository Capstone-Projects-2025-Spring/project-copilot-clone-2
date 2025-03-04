from flask import Blueprint, request, jsonify
import openai_api as openai
import requests
from flasgger import swag_from

suggestions_bp = Blueprint('suggestions', __name__)

OLLAMA_URL = "http://localhost:11434/api/generate"  
DEFAULT_MODEL_NAME = "copilot-style-codellama:latest"

# system command to create a special AI model
# {
#     "name": "copilot-style-codellama",
#     "from": "codellama",
#     "system": "You are an AI assistant that provides code completions similar to GitHub Copilot. However, when specified you will need to respond with small errors that are left for the user to detect. Never point these errors out in any way. Your responses should be concise and continue the user's code seamlessly. Please follow all of the commands when giving completions. SYSTEM: Only respond with the code following the prompt, SYSTEM: Avoid pointing out mistakes, SYSTEM: Respond in only plane text, SYSTEM: Avoid including text describing or explaining the code mistake at all, SYSTEM: Provide comments only where necessary, SYSTEM: Avoid providing additional information, SYSTEM: If the prompt asks for an error, introduce a small syntax or logic mistake in the code. Do not explain or provide any extra context.",
#     "parameters": {
#         "temperature": 0.2,
#         "top_k": 50
#     }
# }

commands = [
    "SYSTEM: Only respond with the code following the prompt.",
    "SYSTEM: Avoid pointing out mistakes.",
    "SYSTEM: Respond in only plane text.",
    "SYSTEM: Avoid including text describing or explaining the code mistake at all",
    "SYSTEM: Provide comments only where necessary.",
    "SYSTEM: Avoid providing additional information.",
    "SYSTEM: If the prompt asks for an error, introduce a small syntax or logic mistake in the code. Do not explain or provide any extra context."
]

good_command = "SYSTEM: Complete the following code:"
bad_command = "SYSTEM: Complete the following code but introduce a small syntax or logic mistake:"

@suggestions_bp.route('/suggestion', methods=['POST'])
@swag_from({
    'tags': ['Suggestions'],
    'summary': 'Generate a suggestion using the AI model',
    'description': 'Sends a prompt to the locally running Ollama model with an optional model name and correctness flag, returning the generated suggestion.',
    'consumes': ['application/json'],
    'produces': ['application/json'],
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'prompt': {
                        'type': 'string',
                        'example': 'def add(a, b):'
                    },
                    'model': {
                        'type': 'string',
                        'example': 'llama3.2:latest',
                        'description': 'The AI model to use for generating the suggestion.'
                    },
                    'isCorrect': {
                        'type': 'boolean',
                        'example': False,
                        'description': 'A flag indicating whether the suggestion should be correct.'
                    }
                },
                'required': ['prompt']
            }
        }
    ],
    'responses': {
        '200': {
            'description': 'Successfully generated suggestion',
            'schema': {
                'type': 'object',
                'properties': {
                    'suggestions': {
                        'type': 'array',
                        'items': {'type': 'string'},
                        'example': ["return a + b"]
                    }
                }
            }
        },
        '400': {
            'description': 'Bad Request - No prompt provided',
            'schema': {
                'type': 'object',
                'properties': {
                    'error': {'type': 'string', 'example': 'No prompt provided'}
                }
            }
        },
        '500': {
            'description': 'Internal Server Error - Failed to generate response',
            'schema': {
                'type': 'object',
                'properties': {
                    'error': {'type': 'string', 'example': 'Connection error'}
                }
            }
        }
    }
})
def generate_suggestion_route():
    """
    Generate a suggestion based on the provided prompt.
    See Swagger docs for more information.
    """
    data = request.json
    prompt = data.get("prompt", "")
    model_name = data.get("model", "ollama")
    temperature = data.get("temperature", 0.2)
    top_p = data.get("top_p", 1)
    top_k = data.get("top_k", 0)
    max_tokens = data.get("max_tokens", 256)
    is_correct = data.get("isCorrect", True)

    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400
    
    # ChatGPT model detected.
    if ("gpt" in model_name):
        try:
            response = openai.getSuggestion(prompt, commands, model=model_name, temperature=temperature, top_p=top_p, max_tokens=max_tokens)
            return jsonify({"suggestions": [response["suggestions"]]})
        except Exception as e:
            print(f"Error fetching OpenAI suggestion: {e}")
            return jsonify({"error": str(e)}), 500
        
    # Ollama detected
    else:
        try:

            # If the request is meant for ollama, but without a specific model, it uses default model.
            if model_name == "ollama":
                model_name = DEFAULT_MODEL_NAME
                
            full_prompt = (
                "".join(commands) + (good_command if is_correct else bad_command) + prompt
            )

            response = requests.post(
                OLLAMA_URL,
                json={
                    "model": model_name,
                    "prompt": full_prompt,
                    "keep_alive": "1h",
                    "stream": False
                },
            )
            response.raise_for_status()
            result = response.json()

            return jsonify({"suggestions": [result["response"]]})
        
        except requests.exceptions.RequestException as e:
            print(f"Error fetching Ollama suggestion: {e}")
            return jsonify({"error": str(e)}), 500