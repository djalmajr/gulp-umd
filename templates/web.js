;(function (root) {
<%= contents %>
<% if (namespace && exports) { %>
root.<%= namespace %> = <%= exports %>;
<% } %>
}(this));
