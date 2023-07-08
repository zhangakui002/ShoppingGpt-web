import Markdown from 'vue3-markdown-it';

export default ({ app, router, store }) => {
    app.use(Markdown)
  }