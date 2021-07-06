(function anonymous() {
  with (this) {
    return _c(
      "div",
      { attrs: { id: "app" } },
      [
        _c("input", {
          directives: [
            {
              name: "model",
              rawName: "v-model",
              value: name,
              expression: "name",
            },
          ],
          attrs: { type: "text" },
          domProps: { value: name },
          on: {
            input: function ($event) {
              if ($event.target.composing) return;
              name = $event.target.value;
            },
          },
        }),
        _v(" "),
        _l(list, function (item) {
          return show ? _c("div", [_v(_s(name))]) : _e();
        }),
        _v(" "),
        _c("div", [_v(_s(age))]),
      ],
      2
    );
  }
});
