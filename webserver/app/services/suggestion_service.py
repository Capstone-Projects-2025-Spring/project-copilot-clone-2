from app.controllers.ai import client, gemini_client, vendors, good_command, bad_command, OLLAMA_URL
from app.models.errors import ModelError
import requests



def getSuggestion(
    prompt: str,
    vendor: str = vendors.Google,
    model_name: str = "codellama",
    temperature: float = 0.2,
    top_p: float = 1,
    top_k: int = 0,
    max_tokens: int = 256,
    is_correct: bool = True
):
    """
    Handles suggestions from different models (OpenAI or Ollama) based on the provided model name.
    
    Args:
        prompt (str): The prompt (or piece of code) to generate suggestions from.
        model_name (str): The model to use (either "openai" or "ollama").
        temperature (float): The temperature value to control randomness.
        top_p (float): The top_p value for sampling.
        top_k (int): The top_k value for sampling.
        max_tokens (int): The maximum number of tokens to generate.
        is_correct (bool): Whether to generate a correct suggestion or one with a small error.
        
    Returns:
        dict: A dictionary containing the suggestion response.
    
    Raises:
        Exception: If there is an error with the model API.
    """
    # Choose model-specific logic
    match vendor:
        case vendors.OpenAI:
            return getSuggestionFromOpenAI(
                prompt,
                model=model_name,
                temperature=temperature,
                top_p=top_p,
                top_k=top_k,
                max_tokens=max_tokens
            )
        case vendors.Ollama:
            return getSuggestionFromOllama(
                prompt,
                model_name=model_name,
                is_correct=is_correct
            )
        case vendors.Google:
            return getSuggestionFromGoogle(
                prompt
            )
        case _:
            return getSuggestionFromOllama(
                prompt,
                model_name=model_name,
                is_correct=is_correct
            )

def getSuggestionFromOpenAI(
    prompt: str,
    model: str = "gpt-4o-mini",
    temperature: float = 0.2,
    top_p: float = 1,
    top_k: float = 1,
    max_tokens: int = 256
):
    """
    Completes a code suggestion using OpenAI's API.
    """
    try:
        # Send the prompt and system messages to OpenAI API
        messages = [{"role": "system", "content": "SYSTEM: Complete the following code:"}, {"role": "user", "content": prompt}]
        
        completion = client.chat.completions.create(
            temperature=temperature,
            top_p=top_p,
            max_tokens=max_tokens,
            model=model,
            messages=messages
        )
        
        return completion.choices[0].message.content
    
    except Exception as e:
        print(f"Error generating suggestion using OpenAI's API: {e}")
        raise ModelError(f"Error generating suggestion using OpenAI's API: {e}")

def getSuggestionFromOllama(prompt: str, model_name: str, is_correct: bool):
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
    
def getSuggestionFromGoogle(prompt: str):
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