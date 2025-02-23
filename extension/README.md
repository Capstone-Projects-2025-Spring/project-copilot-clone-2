# Extension Readme

## Building the docs

run `npx typedoc src --entryPointStrategy expand --plugin typedoc-theme-hierarchy --theme hierarchy --readme none` in the extension directory.

Docs automatically get put in "/webserver/docs/tsdoc" so they can be served from the api.

To update the docs shown on docusaurus move the tsdoc folder to /documentation/static/. This goes for the extension and webserver docs. To update the api doc run the server with the new changes and navigate to localhost:8001/apispec_1.json and download the file. Replace the old apispec in "/documentation/static" with the new file


## Requirements

TODO

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.
