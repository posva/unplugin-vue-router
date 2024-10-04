# ESlint

If you are not using auto imports, you will need to tell ESlint about `vue-router/auto-routes`. Add these lines to your eslint configuration:

```json{3}
{
  "settings": {
    "import/core-modules": ["vue-router/auto-routes"]
  }
}
```

## `definePage()`

Since `definePage()` is a global macro, you need to tell ESlint about it. Add these lines to your eslint configuration:

```json{3}
{
  "globals": {
    "definePage": "readonly"
  }
}
```
