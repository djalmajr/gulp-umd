;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(<%= amd %>, factory);
  } else if (typeof exports === 'object') {
    factory(exports<%= commaCjs %>);
  } else {<%
    if (namespace) { %>
    root.<%= namespace %> = {};<%
    } %>
    factory(root<%= commaGlobal %>);
  }
}(this, function (exports<%= commaParam %>) {
<%= contents %><%
if (exports) {
  if (typeof exports === 'string') { %>
exports.<%= exports %> = <%= exports %>;<%
  } else if (exports) {
    for (var key in exports) {
      if ({}.hasOwnProperty.call(exports,key)) {
%>
exports.<%= key %> = <%= exports[key] %>;<%
      }
    }
  }
}
%>
}));
