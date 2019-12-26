;(function () {
<%= contents %>
<% if (namespace && exports) { %>
this.<%= namespace %> = <%= exports %>;
<% } %>
}).call(this);
