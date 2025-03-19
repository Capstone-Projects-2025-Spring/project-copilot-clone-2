from app.controllers.ai import openai_client, gemini_client, vendors, good_command, bad_command, OLLAMA_URL, default_openai_parameters
from app.models.errors import ModelError
import requests
from flask import current_app



def getSuggestion(
    prompt: str,
    vendor: str = vendors.Ollama.value,
    model_name: str = "codellama:7b",
    model_params: dict = {},
    is_correct: bool = True
):
    """
    Handles suggestions from different models based on the provided model name.
    
    Args:
        prompt (str): The prompt (or piece of code) to generate suggestions from.
        vendor (str): The vendor of the AI model(OpenAI, Ollama, Google)
        model_name (str): The model to use( See vendor website).
        model_params (dict): Additional parameters to be sent to the AI.
        is_correct (bool): Whether to generate a correct suggestion or one with a small error.
        
    Returns:
        dict: A dictionary containing the suggestion response.
    
    Raises:
        Exception: If there is an error with the model API.
    """

    try:
        vendor_enum = vendors(vendor)  # Convert string to Enum
    except ValueError:
        vendor_enum = vendors.Ollama  # Default if invalid

    # Choose model-specific logic
    match vendor_enum:
        case vendors.OpenAI:
            return getSuggestionFromOpenAI(
                prompt=prompt,
                model=model_name,
                model_params=model_params,
                is_correct=is_correct
            )
        case vendors.Ollama:
            return getSuggestionFromOllama(
                prompt=prompt,
                model_name=model_name,
                model_params=model_params,
                is_correct=is_correct
            )
        case vendors.Google:
            return getSuggestionFromGoogle(
                prompt=prompt,
                model_name=model_name,
                model_params=model_params,
                is_correct=is_correct
            )
        case _:
            return getSuggestionFromOllama(
                prompt=prompt,
                model_name=model_name,
                model_params=model_params,
                is_correct=is_correct
            )

def getSuggestionFromOpenAI(
    prompt: str,
    model: str = "gpt-4o-mini",
    model_params: dict = None,
    is_correct: bool = True
):
    """
    Completes a code suggestion using OpenAI's API.
    """

    try:
        # Ensure model_params is a dictionary
        if model_params is None:
            model_params = default_openai_parameters  # Use a default config
        
        if is_correct:
            system_message = "SYSTEM: Complete the following code correctly:"
        else:
            system_message = (
                "SYSTEM: Complete the following code, but introduce a small mistake "
                "(like a syntax error, incorrect logic, or missing a crucial step)."
            )

        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": prompt}
        ]
        with current_app.app_context():
            completion = openai_client.chat.completions.create(
                temperature=model_params.get("temperature"),
                top_p=model_params.get("top_p"),
                max_tokens=model_params.get("max_tokens"),
                model=model,
                messages=messages
            )

            return completion.choices[0].message.content
    
    except Exception as e:
        print(f"Error generating suggestion using OpenAI's API: {e}")
        raise ModelError(f"Error generating suggestion using OpenAI's API: {e}")

def getSuggestionFromOllama(
        prompt: str,
        model_name: str,
        model_params: dict,
        is_correct: bool
):
    """
    Generates a suggestion from Ollama.
    """
    
    full_prompt = (
        good_command if is_correct else bad_command
    ) + prompt

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": model_name,
                "prompt": full_prompt,
                "keep_alive": "1h",
                "stream": False
            }
        )
        response.raise_for_status()  # Raise exception for HTTP errors
        result = response.json()
        return result["response"]
    
    except Exception as e:
        print(f"Error fetching Ollama suggestion: {e}")
        raise ModelError(f"Error fetching Ollama suggestion: {e}")
    
def getSuggestionFromGoogle(
        prompt: str,
        model_name: str,
        model_params: dict,
        is_correct: bool
):
    """
    Sends the prompt to the model and returns an array of two code snippets:
    one correct and one with a small logic error.

    Args:
        prompt (str): The code snippet to complete (e.g., "function add").

    Returns:
        list[str]: An array containing two code snippets.
    """
    # Combine the predefined instructions with the user's prompt
    full_prompt = f"You are an AI that suggests code snippets in an array, one correct and one with a small logic error, without any explanations, comments, or markdown formatting. Only return the missing part, and do not repeat existing code. The snippets should not generate syntax errors.\n\n{prompt}"

    # Send the prompt to the model
    response = gemini_client.chat_session.send_message(full_prompt)

    # Process the response to ensure it's in the correct format
    suggestions = response.text.strip().split("\n\n")  # Split into correct and incorrect snippets

    # Ensure the response is an array with exactly two elements
    if len(suggestions) == 2:
        return suggestions
    else:
        raise ValueError("Error: The response did not return exactly two snippets.")
    


def getAvailableModels(vendor: vendors):
    vendor_enum = vendors(vendor)

    # Choose model-specific logic
    match vendor_enum:
        case vendors.OpenAI:
            return getModelsFromOpenAI()
        case vendors.Ollama:
            return getModelsFromOllama()
        case vendors.Google:
            return getModelsFromGoogle()
        case _:
            raise ValueError(f"Unsupported vendor: {vendor}")


def getModelsFromOpenAI():
    try:
        with current_app.app_context():
            models = openai_client.models.list()  # Fetch models from OpenAI API
            model_names = [model.id for model in models.data]  # Extract model names
            return model_names

    except Exception as e:
        raise e
    

def getModelsFromOllama():
        try:
            response = requests.get("http://localhost:11434/api/tags")
            
            response.raise_for_status()

            models = response.json()
            print(models)

            model_names = models.get("models", [])

            return model_names

        except requests.exceptions.RequestException as e:
            raise Exception(f"Error fetching models from Ollama: {e}")


def getModelsFromGoogle():
    models_for_generate_content = []

    for m in gemini_client.models.list():
        if "generateContent" in m.supported_actions:
            models_for_generate_content.append(m.name)

    return models_for_generate_content