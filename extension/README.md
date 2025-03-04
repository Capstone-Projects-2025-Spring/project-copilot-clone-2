# Extension Readme

## Building the docs

run `npx typedoc src --entryPointStrategy expand --plugin typedoc-theme-hierarchy --theme hierarchy --readme none` in the extension directory.

Docs automatically get put in "/webserver/docs/tsdoc" so they can be served from the api.

To update the docs shown on docusaurus move the tsdoc folder to /documentation/static/. This goes for the extension and webserver docs. To update the api doc run the server with the new changes and navigate to localhost:8001/apispec_1.json and download the file. Replace the old apispec in "/documentation/static" with the new file


## Requirements

TODO

## Extension Settings

Extension settings can be modified in VSCode settings using the shorcut `CTRL+,` 

Alternatively you can navigate to File>Preferences>Settings>User>Extensions

Settings include basic model paramters, changing which model you're trying to use, and changing the endpoint for handling suggestions.

### Debugging
There is a command for debugging fetching a suggestion.

Use the shortcut `CTRL+SHIFT+P` to bring up the command palette, search for the "Test Fetch Suggestions" command and run it.

You can type in a snippet of code you'd like to have finished, and a window will pop-up showing you the response from the LLM.

## Extension Testings

To run the test:

* `fetchSuggestion`: 
```
npx jest suggestion.test.ts
```
