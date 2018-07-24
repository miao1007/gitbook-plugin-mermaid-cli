String based pipeline wrapper for mermaid.cli.

## Features
* Based on mermaid.cli/puppeteer, generate svg at compile time with inlined css, which can reduces the amount of files.
* No external css and js required.
* Same API like gitbook-plugin-mermaid/Typora

## Install

in the book.json:

```
{
    "plugins": ["mermaid-cli"]
}
```

You will download a chrome during the installation, it's slow but worth waiting. The code is more simple than phantomjs(it cost my the whole day with failing on env/installation settings).

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

Plugin will pick up block body and replace it with generated svg diagram.
To load graph ~~from file~~, put in your book block as:
```
{% mermaid src="./diagram.mermaid" %}
{% endmermaid %}
```
If not absolute, plugin will resolve path given in `src` attribute relative to the current book page,
load its content and generate svg diagram.
