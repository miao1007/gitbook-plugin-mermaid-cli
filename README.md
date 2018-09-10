Render flowcharts in markdown with mermaid.cli.

## Features
* Based on mermaid.cli/puppeteer, generate svg with base64 encode at compile time with inlined css, no external css and js required.
* Same API like gitbook-plugin-mermaid/Typora

## How Does it work

```
1. Your mermaid string quote with mermaid
2. Puppeteer/Chrome Runtime
3. SVG(XML)
4. <img src='data:image/svg+xml;base64,xxxx'>
```


## Install
mermaid.cli is based on puppeteer, which need to download a Chrome. to skip download a chrome

in the book.json:

config your chrome exec file

```json
{
  "plugins": ["mermaid-cli"],
  "pluginsConfig": {
    "mermaid-cli": {
      "chromeDir": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    },
  }
}
```

then

```sh
# see https://github.com/GoogleChrome/puppeteer/blob/v1.8.0/docs/api.md#environment-variables
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
# install plugin
gitbook install
# run the gitbook
gitbook serve
```

Now we can use a local Chrome Runtime without download the slowly large file from npm.


### How to use it?
> It's the same API as [JozoVilcek/piranna's gitbook-plugin-mermaid](https://github.com/piranna/gitbook-plugin-mermaid)


There are two options how can be graph put into the gitbook.
To use ~~embedded~~ graph, put in your book block as:
```
{% mermaid %}
graph TD;
  A-->B;
  A-->C;
  B-->D;
  C-->D;
{% endmermaid %}
```

or

    ```mermaid
    graph TD;
      A-->B;
      A-->C;
      B-->D;
      C-->D;
    ```

Plugin will pick up block body and replace it with generated base64 svg diagram.
To load graph ~~from file~~, put in your book block as:
```
{% mermaid src="./diagram.mermaid" %}
{% endmermaid %}
```
If not absolute, plugin will resolve path given in `src` attribute relative to the current book page,
load its content and generate svg diagram.

## TODO
* remove unnecessary style from svg
* add test case