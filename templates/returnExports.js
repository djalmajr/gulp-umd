;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(<%= amd %>, factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(<%= cjs %>);
  } else {<%
    if (namespace) { %>
    root.<%= namespace %> = factory(<%= global %>);<%
    } else { %>
    factory(<%= global %>);<%
    } %>
  }
}(this, function(<%= param %>) {
<%= contents %><%
if (exports) { %>
return <%= exports %>;<%
} %>
}));
