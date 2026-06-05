!function(n,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define('preact',["exports"],t):t((n||self).preact={})}(this,function(n){var t,i,e,r,f,o,u,c,s,a,h,p,l,y="http://www.w3.org/2000/svg",v="http://www.w3.org/1999/xhtml",d=null,w=void 0,g={},_=[],b=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,m=Array.isArray;function k(n,t){for(var i in t)n[i]=t[i];return n}function x(n){n&&n.parentNode&&n.parentNode.removeChild(n)}function S(n,i,e){var r,f,o,u={};for(o in i)"key"==o?r=i[o]:"ref"==o?f=i[o]:u[o]=i[o];if(arguments.length>2&&(u.children=arguments.length>3?t.call(arguments,2):e),"function"==typeof n&&n.defaultProps!=d)for(o in n.defaultProps)u[o]===w&&(u[o]=n.defaultProps[o]);return M(n,u,r,f,d)}function M(n,t,r,f,o){var u={type:n,props:t,key:r,ref:f,__k:d,__:d,__b:0,__e:d,__c:d,constructor:w,__v:o==d?++e:o,__i:-1,__u:0};return o==d&&i.vnode!=d&&i.vnode(u),u}function T(n){return n.children}function $(n,t){this.props=n,this.context=t}function C(n,t){if(t==d)return n.__?C(n.__,n.__i+1):d;for(var i;t<n.__k.length;t++)if((i=n.__k[t])!=d&&i.__e!=d)return i.__e;return"function"==typeof n.type?C(n):d}function I(n){var t,i;if((n=n.__)!=d&&n.__c!=d){for(n.__e=n.__c.base=d,t=0;t<n.__k.length;t++)if((i=n.__k[t])!=d&&i.__e!=d){n.__e=n.__c.base=i.__e;break}return I(n)}}function P(n){(!n.__d&&(n.__d=!0)&&f.push(n)&&!j.__r++||o!=i.debounceRendering)&&((o=i.debounceRendering)||u)(j)}function j(){for(var n,t,e,r,o,u,s,a=1;f.length;)f.length>a&&f.sort(c),n=f.shift(),a=f.length,n.__d&&(e=void 0,o=(r=(t=n).__v).__e,u=[],s=[],t.__P&&((e=k({},r)).__v=r.__v+1,i.vnode&&i.vnode(e),V(t.__P,e,r,t.__n,t.__P.namespaceURI,32&r.__u?[o]:d,u,o==d?C(r):o,!!(32&r.__u),s),e.__v=r.__v,e.__.__k[e.__i]=e,q(u,e,s),e.__e!=o&&I(e)));j.__r=0}function A(n,t,i,e,r,f,o,u,c,s,a){var h,p,l,y,v,b,m=e&&e.__k||_,k=t.length;for(c=H(i,t,m,c,k),h=0;h<k;h++)(l=i.__k[h])!=d&&(p=-1==l.__i?g:m[l.__i]||g,l.__i=h,b=V(n,l,p,r,f,o,u,c,s,a),y=l.__e,l.ref&&p.ref!=l.ref&&(p.ref&&E(p.ref,d,l),a.push(l.ref,l.__c||y,l)),v==d&&y!=d&&(v=y),4&l.__u||p.__k===l.__k?c=L(l,c,n):"function"==typeof l.type&&b!==w?c=b:y&&(c=y.nextSibling),l.__u&=-7);return i.__e=v,c}function H(n,t,i,e,r){var f,o,u,c,s,a=i.length,h=a,p=0;for(n.__k=new Array(r),f=0;f<r;f++)(o=t[f])!=d&&"boolean"!=typeof o&&"function"!=typeof o?(c=f+p,(o=n.__k[f]="string"==typeof o||"number"==typeof o||"bigint"==typeof o||o.constructor==String?M(d,o,d,d,d):m(o)?M(T,{children:o},d,d,d):o.constructor===w&&o.__b>0?M(o.type,o.props,o.key,o.ref?o.ref:d,o.__v):o).__=n,o.__b=n.__b+1,s=o.__i=F(o,i,c,h),u=d,-1!=s&&(h--,(u=i[s])&&(u.__u|=2)),u==d||u.__v==d?(-1==s&&(r>a?p--:r<a&&p++),"function"!=typeof o.type&&(o.__u|=4)):s!=c&&(s==c-1?p--:s==c+1?p++:(s>c?p--:p++,o.__u|=4))):n.__k[f]=d;if(h)for(f=0;f<a;f++)(u=i[f])!=d&&0==(2&u.__u)&&(u.__e==e&&(e=C(u)),G(u,u));return e}function L(n,t,i){var e,r;if("function"==typeof n.type){for(e=n.__k,r=0;e&&r<e.length;r++)e[r]&&(e[r].__=n,t=L(e[r],t,i));return t}n.__e!=t&&(t&&n.type&&!i.contains(t)&&(t=C(n)),i.insertBefore(n.__e,t||d),t=n.__e);do{t=t&&t.nextSibling}while(t!=d&&8==t.nodeType);return t}function F(n,t,i,e){var r,f,o=n.key,u=n.type,c=t[i];if(c===d&&null==n.key||c&&o==c.key&&u==c.type&&0==(2&c.__u))return i;if(e>(c!=d&&0==(2&c.__u)?1:0))for(r=i-1,f=i+1;r>=0||f<t.length;){if(r>=0){if((c=t[r])&&0==(2&c.__u)&&o==c.key&&u==c.type)return r;r--}if(f<t.length){if((c=t[f])&&0==(2&c.__u)&&o==c.key&&u==c.type)return f;f++}}return-1}function O(n,t,i){"-"==t[0]?n.setProperty(t,i==d?"":i):n[t]=i==d?"":"number"!=typeof i||b.test(t)?i:i+"px"}function z(n,t,i,e,r){var f,o;n:if("style"==t)if("string"==typeof i)n.style.cssText=i;else{if("string"==typeof e&&(n.style.cssText=e=""),e)for(t in e)i&&t in i||O(n.style,t,"");if(i)for(t in i)e&&i[t]==e[t]||O(n.style,t,i[t])}else if("o"==t[0]&&"n"==t[1])f=t!=(t=t.replace(s,"$1")),o=t.toLowerCase(),t=o in n||"onFocusOut"==t||"onFocusIn"==t?o.slice(2):t.slice(2),n.l||(n.l={}),n.l[t+f]=i,i?e?i.t=e.t:(i.t=a,n.addEventListener(t,f?p:h,f)):n.removeEventListener(t,f?p:h,f);else{if(r==y)t=t.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if("width"!=t&&"height"!=t&&"href"!=t&&"list"!=t&&"form"!=t&&"tabIndex"!=t&&"download"!=t&&"rowSpan"!=t&&"colSpan"!=t&&"role"!=t&&"popover"!=t&&t in n)try{n[t]=i==d?"":i;break n}catch(n){}"function"==typeof i||(i==d||!1===i&&"-"!=t[4]?n.removeAttribute(t):n.setAttribute(t,"popover"==t&&1==i?"":i))}}function N(n){return function(t){if(this.l){var e=this.l[t.type+n];if(t.i==d)t.i=a++;else if(t.i<e.t)return;return e(i.event?i.event(t):t)}}}function V(n,t,e,r,f,o,u,c,s,a){var h,p,l,y,v,g,_,b,S,M,C,I,P,j,H,L,F,O=t.type;if(t.constructor!==w)return d;128&e.__u&&(s=!!(32&e.__u),o=[c=t.__e=e.__e]),(h=i.__b)&&h(t);n:if("function"==typeof O)try{if(b=t.props,S="prototype"in O&&O.prototype.render,M=(h=O.contextType)&&r[h.__c],C=h?M?M.props.value:h.__:r,e.__c?_=(p=t.__c=e.__c).__=p.__E:(S?t.__c=p=new O(b,C):(t.__c=p=new $(b,C),p.constructor=O,p.render=J),M&&M.sub(p),p.props=b,p.state||(p.state={}),p.context=C,p.__n=r,l=p.__d=!0,p.__h=[],p._sb=[]),S&&p.__s==d&&(p.__s=p.state),S&&O.getDerivedStateFromProps!=d&&(p.__s==p.state&&(p.__s=k({},p.__s)),k(p.__s,O.getDerivedStateFromProps(b,p.__s))),y=p.props,v=p.state,p.__v=t,l)S&&O.getDerivedStateFromProps==d&&p.componentWillMount!=d&&p.componentWillMount(),S&&p.componentDidMount!=d&&p.__h.push(p.componentDidMount);else{if(S&&O.getDerivedStateFromProps==d&&b!==y&&p.componentWillReceiveProps!=d&&p.componentWillReceiveProps(b,C),!p.__e&&p.shouldComponentUpdate!=d&&!1===p.shouldComponentUpdate(b,p.__s,C)||t.__v==e.__v){for(t.__v!=e.__v&&(p.props=b,p.state=p.__s,p.__d=!1),t.__e=e.__e,t.__k=e.__k,t.__k.some(function(n){n&&(n.__=t)}),I=0;I<p._sb.length;I++)p.__h.push(p._sb[I]);p._sb=[],p.__h.length&&u.push(p);break n}p.componentWillUpdate!=d&&p.componentWillUpdate(b,p.__s,C),S&&p.componentDidUpdate!=d&&p.__h.push(function(){p.componentDidUpdate(y,v,g)})}if(p.context=C,p.props=b,p.__P=n,p.__e=!1,P=i.__r,j=0,S){for(p.state=p.__s,p.__d=!1,P&&P(t),h=p.render(p.props,p.state,p.context),H=0;H<p._sb.length;H++)p.__h.push(p._sb[H]);p._sb=[]}else do{p.__d=!1,P&&P(t),h=p.render(p.props,p.state,p.context),p.state=p.__s}while(p.__d&&++j<25);p.state=p.__s,p.getChildContext!=d&&(r=k(k({},r),p.getChildContext())),S&&!l&&p.getSnapshotBeforeUpdate!=d&&(g=p.getSnapshotBeforeUpdate(y,v)),L=h,h!=d&&h.type===T&&h.key==d&&(L=B(h.props.children)),c=A(n,m(L)?L:[L],t,e,r,f,o,u,c,s,a),p.base=t.__e,t.__u&=-161,p.__h.length&&u.push(p),_&&(p.__E=p.__=d)}catch(n){if(t.__v=d,s||o!=d)if(n.then){for(t.__u|=s?160:128;c&&8==c.nodeType&&c.nextSibling;)c=c.nextSibling;o[o.indexOf(c)]=d,t.__e=c}else for(F=o.length;F--;)x(o[F]);else t.__e=e.__e,t.__k=e.__k;i.__e(n,t,e)}else o==d&&t.__v==e.__v?(t.__k=e.__k,t.__e=e.__e):c=t.__e=D(e.__e,t,e,r,f,o,u,s,a);return(h=i.diffed)&&h(t),128&t.__u?void 0:c}function q(n,t,e){for(var r=0;r<e.length;r++)E(e[r],e[++r],e[++r]);i.__c&&i.__c(t,n),n.some(function(t){try{n=t.__h,t.__h=[],n.some(function(n){n.call(t)})}catch(n){i.__e(n,t.__v)}})}function B(n){return"object"!=typeof n||n==d||n.__b&&n.__b>0?n:m(n)?n.map(B):k({},n)}function D(n,e,r,f,o,u,c,s,a){var h,p,l,_,b,k,S,M=r.props,T=e.props,$=e.type;if("svg"==$?o=y:"math"==$?o="http://www.w3.org/1998/Math/MathML":o||(o=v),u!=d)for(h=0;h<u.length;h++)if((b=u[h])&&"setAttribute"in b==!!$&&($?b.localName==$:3==b.nodeType)){n=b,u[h]=d;break}if(n==d){if($==d)return document.createTextNode(T);n=document.createElementNS(o,$,T.is&&T),s&&(i.__m&&i.__m(e,u),s=!1),u=d}if($==d)M===T||s&&n.data==T||(n.data=T);else{if(u=u&&t.call(n.childNodes),M=r.props||g,!s&&u!=d)for(M={},h=0;h<n.attributes.length;h++)M[(b=n.attributes[h]).name]=b.value;for(h in M)if(b=M[h],"children"==h);else if("dangerouslySetInnerHTML"==h)l=b;else if(!(h in T)){if("value"==h&&"defaultValue"in T||"checked"==h&&"defaultChecked"in T)continue;z(n,h,d,b,o)}for(h in T)b=T[h],"children"==h?_=b:"dangerouslySetInnerHTML"==h?p=b:"value"==h?k=b:"checked"==h?S=b:s&&"function"!=typeof b||M[h]===b||z(n,h,b,M[h],o);if(p)s||l&&(p.__html==l.__html||p.__html==n.innerHTML)||(n.innerHTML=p.__html),e.__k=[];else if(l&&(n.innerHTML=""),A("template"==e.type?n.content:n,m(_)?_:[_],e,r,f,"foreignObject"==$?v:o,u,c,u?u[0]:r.__k&&C(r,0),s,a),u!=d)for(h=u.length;h--;)x(u[h]);s||(h="value","progress"==$&&k==d?n.removeAttribute("value"):k!=w&&(k!==n[h]||"progress"==$&&!k||"option"==$&&k!=M[h])&&z(n,h,k,M[h],o),h="checked",S!=w&&S!=n[h]&&z(n,h,S,M[h],o))}return n}function E(n,t,e){try{if("function"==typeof n){var r="function"==typeof n.__u;r&&n.__u(),r&&t==d||(n.__u=n(t))}else n.current=t}catch(n){i.__e(n,e)}}function G(n,t,e){var r,f;if(i.unmount&&i.unmount(n),(r=n.ref)&&(r.current&&r.current!=n.__e||E(r,d,t)),(r=n.__c)!=d){if(r.componentWillUnmount)try{r.componentWillUnmount()}catch(n){i.__e(n,t)}r.base=r.__P=d}if(r=n.__k)for(f=0;f<r.length;f++)r[f]&&G(r[f],t,e||"function"!=typeof n.type);e||x(n.__e),n.__c=n.__=n.__e=w}function J(n,t,i){return this.constructor(n,i)}function K(n,e,r){var f,o,u,c;e==document&&(e=document.documentElement),i.__&&i.__(n,e),o=(f="function"==typeof r)?d:r&&r.__k||e.__k,u=[],c=[],V(e,n=(!f&&r||e).__k=S(T,d,[n]),o||g,g,e.namespaceURI,!f&&r?[r]:o?d:e.firstChild?t.call(e.childNodes):d,u,!f&&r?r:o?o.__e:e.firstChild,f,c),q(u,n,c)}t=_.slice,i={__e:function(n,t,i,e){for(var r,f,o;t=t.__;)if((r=t.__c)&&!r.__)try{if((f=r.constructor)&&f.getDerivedStateFromError!=d&&(r.setState(f.getDerivedStateFromError(n)),o=r.__d),r.componentDidCatch!=d&&(r.componentDidCatch(n,e||{}),o=r.__d),o)return r.__E=r}catch(t){n=t}throw n}},e=0,r=function(n){return n!=d&&n.constructor===w},$.prototype.setState=function(n,t){var i;i=this.__s!=d&&this.__s!=this.state?this.__s:this.__s=k({},this.state),"function"==typeof n&&(n=n(k({},i),this.props)),n&&k(i,n),n!=d&&this.__v&&(t&&this._sb.push(t),P(this))},$.prototype.forceUpdate=function(n){this.__v&&(this.__e=!0,n&&this.__h.push(n),P(this))},$.prototype.render=T,f=[],u="function"==typeof Promise?Promise.prototype.then.bind(Promise.resolve()):setTimeout,c=function(n,t){return n.__v.__b-t.__v.__b},j.__r=0,s=/(PointerCapture)$|Capture$/i,a=0,h=N(!1),p=N(!0),l=0,n.Component=$,n.Fragment=T,n.cloneElement=function(n,i,e){var r,f,o,u,c=k({},n.props);for(o in n.type&&n.type.defaultProps&&(u=n.type.defaultProps),i)"key"==o?r=i[o]:"ref"==o?f=i[o]:c[o]=i[o]===w&&u!=w?u[o]:i[o];return arguments.length>2&&(c.children=arguments.length>3?t.call(arguments,2):e),M(n.type,c,r||n.key,f||n.ref,d)},n.createContext=function(n){function t(n){var i,e;return this.getChildContext||(i=new Set,(e={})[t.__c]=this,this.getChildContext=function(){return e},this.componentWillUnmount=function(){i=d},this.shouldComponentUpdate=function(n){this.props.value!=n.value&&i.forEach(function(n){n.__e=!0,P(n)})},this.sub=function(n){i.add(n);var t=n.componentWillUnmount;n.componentWillUnmount=function(){i&&i.delete(n),t&&t.call(n)}}),n.children}return t.__c="__cC"+l++,t.__=n,t.Provider=t.__l=(t.Consumer=function(n,t){return n.children(t)}).contextType=t,t},n.createElement=S,n.createRef=function(){return{current:d}},n.h=S,n.hydrate=function n(t,i){K(t,i,n)},n.isValidElement=r,n.options=i,n.render=K,n.toChildArray=function n(t,i){return i=i||[],t==d||"boolean"==typeof t||(m(t)?t.some(function(t){n(t,i)}):i.push(t)),i}});
//# sourceMappingURL=preact.umd.js.map
;
!function(e,r){"object"==typeof exports&&"undefined"!=typeof module?r(exports,require("preact")):"function"==typeof define&&define.amd?define('preact/jsx-runtime',["exports","preact"],r):r((e||self).jsxRuntime={},e.preact)}(this,function(e,r){var n=/["&<]/;function t(e){if(0===e.length||!1===n.test(e))return e;for(var r=0,t=0,o="",f="";t<e.length;t++){switch(e.charCodeAt(t)){case 34:f="&quot;";break;case 38:f="&amp;";break;case 60:f="&lt;";break;default:continue}t!==r&&(o+=e.slice(r,t)),o+=f,r=t+1}return t!==r&&(o+=e.slice(r,t)),o}var o=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,f=0,i=Array.isArray;function u(e,n,t,o,i,u){n||(n={});var c,a,l=n;if("ref"in l)for(a in l={},n)"ref"==a?c=n[a]:l[a]=n[a];var p={type:e,props:l,key:t,ref:c,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--f,__i:-1,__u:0,__source:i,__self:u};if("function"==typeof e&&(c=e.defaultProps))for(a in c)void 0===l[a]&&(l[a]=c[a]);return r.options.vnode&&r.options.vnode(p),p}var c={},a=/[A-Z]/g;Object.defineProperty(e,"Fragment",{enumerable:!0,get:function(){return r.Fragment}}),e.jsx=u,e.jsxAttr=function(e,n){if(r.options.attr){var f=r.options.attr(e,n);if("string"==typeof f)return f}if(n=function(e){return null!==e&&"object"==typeof e&&"function"==typeof e.valueOf?e.valueOf():e}(n),"ref"===e||"key"===e)return"";if("style"===e&&"object"==typeof n){var i="";for(var u in n){var l=n[u];if(null!=l&&""!==l){var p="-"==u[0]?u:c[u]||(c[u]=u.replace(a,"-$&").toLowerCase()),s=";";"number"!=typeof l||p.startsWith("--")||o.test(p)||(s="px;"),i=i+p+":"+l+s}}return e+'="'+t(i)+'"'}return null==n||!1===n||"function"==typeof n||"object"==typeof n?"":!0===n?e:e+'="'+t(""+n)+'"'},e.jsxDEV=u,e.jsxEscape=function e(r){if(null==r||"boolean"==typeof r||"function"==typeof r)return null;if("object"==typeof r){if(void 0===r.constructor)return r;if(i(r)){for(var n=0;n<r.length;n++)r[n]=e(r[n]);return r}}return t(""+r)},e.jsxTemplate=function(e){var n=u(r.Fragment,{tpl:e,exprs:[].slice.call(arguments,1)});return n.key=n.__v,n},e.jsxs=u});
//# sourceMappingURL=jsxRuntime.umd.js.map
;
!function(n,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports,require("preact")):"function"==typeof define&&define.amd?define('preact/hooks',["exports","preact"],t):t((n||self).preactHooks={},n.preact)}(this,function(n,t){var u,i,r,o,f=0,c=[],e=t.options,a=e.__b,v=e.__r,l=e.diffed,d=e.__c,s=e.unmount,p=e.__;function y(n,t){e.__h&&e.__h(i,n,f||t),f=0;var u=i.__H||(i.__H={__:[],__h:[]});return n>=u.__.length&&u.__.push({}),u.__[n]}function h(n){return f=1,m(j,n)}function m(n,t,r){var o=y(u++,2);if(o.t=n,!o.__c&&(o.__=[r?r(t):j(void 0,t),function(n){var t=o.__N?o.__N[0]:o.__[0],u=o.t(t,n);t!==u&&(o.__N=[u,o.__[1]],o.__c.setState({}))}],o.__c=i,!i.__f)){var f=function(n,t,u){if(!o.__c.__H)return!0;var i=o.__c.__H.__.filter(function(n){return!!n.__c});if(i.every(function(n){return!n.__N}))return!c||c.call(this,n,t,u);var r=o.__c.props!==n;return i.forEach(function(n){if(n.__N){var t=n.__[0];n.__=n.__N,n.__N=void 0,t!==n.__[0]&&(r=!0)}}),c&&c.call(this,n,t,u)||r};i.__f=!0;var c=i.shouldComponentUpdate,e=i.componentWillUpdate;i.componentWillUpdate=function(n,t,u){if(this.__e){var i=c;c=void 0,f(n,t,u),c=i}e&&e.call(this,n,t,u)},i.shouldComponentUpdate=f}return o.__N||o.__}function T(n,t){var r=y(u++,4);!e.__s&&g(r.__H,t)&&(r.__=n,r.u=t,i.__h.push(r))}function _(n,t){var i=y(u++,7);return g(i.__H,t)&&(i.__=n(),i.__H=t,i.__h=n),i.__}function b(){for(var n;n=c.shift();)if(n.__P&&n.__H)try{n.__H.__h.forEach(A),n.__H.__h.forEach(F),n.__H.__h=[]}catch(t){n.__H.__h=[],e.__e(t,n.__v)}}e.__b=function(n){i=null,a&&a(n)},e.__=function(n,t){n&&t.__k&&t.__k.__m&&(n.__m=t.__k.__m),p&&p(n,t)},e.__r=function(n){v&&v(n),u=0;var t=(i=n.__c).__H;t&&(r===i?(t.__h=[],i.__h=[],t.__.forEach(function(n){n.__N&&(n.__=n.__N),n.u=n.__N=void 0})):(t.__h.forEach(A),t.__h.forEach(F),t.__h=[],u=0)),r=i},e.diffed=function(n){l&&l(n);var t=n.__c;t&&t.__H&&(t.__H.__h.length&&(1!==c.push(t)&&o===e.requestAnimationFrame||((o=e.requestAnimationFrame)||x)(b)),t.__H.__.forEach(function(n){n.u&&(n.__H=n.u),n.u=void 0})),r=i=null},e.__c=function(n,t){t.some(function(n){try{n.__h.forEach(A),n.__h=n.__h.filter(function(n){return!n.__||F(n)})}catch(u){t.some(function(n){n.__h&&(n.__h=[])}),t=[],e.__e(u,n.__v)}}),d&&d(n,t)},e.unmount=function(n){s&&s(n);var t,u=n.__c;u&&u.__H&&(u.__H.__.forEach(function(n){try{A(n)}catch(n){t=n}}),u.__H=void 0,t&&e.__e(t,u.__v))};var q="function"==typeof requestAnimationFrame;function x(n){var t,u=function(){clearTimeout(i),q&&cancelAnimationFrame(t),setTimeout(n)},i=setTimeout(u,35);q&&(t=requestAnimationFrame(u))}function A(n){var t=i,u=n.__c;"function"==typeof u&&(n.__c=void 0,u()),i=t}function F(n){var t=i;n.__c=n.__(),i=t}function g(n,t){return!n||n.length!==t.length||t.some(function(t,u){return t!==n[u]})}function j(n,t){return"function"==typeof t?t(n):t}n.useCallback=function(n,t){return f=8,_(function(){return n},t)},n.useContext=function(n){var t=i.context[n.__c],r=y(u++,9);return r.c=n,t?(null==r.__&&(r.__=!0,t.sub(i)),t.props.value):n.__},n.useDebugValue=function(n,t){e.useDebugValue&&e.useDebugValue(t?t(n):n)},n.useEffect=function(n,t){var r=y(u++,3);!e.__s&&g(r.__H,t)&&(r.__=n,r.u=t,i.__H.__h.push(r))},n.useErrorBoundary=function(n){var t=y(u++,10),r=h();return t.__=n,i.componentDidCatch||(i.componentDidCatch=function(n,u){t.__&&t.__(n,u),r[1](n)}),[r[0],function(){r[1](void 0)}]},n.useId=function(){var n=y(u++,11);if(!n.__){for(var t=i.__v;null!==t&&!t.__m&&null!==t.__;)t=t.__;var r=t.__m||(t.__m=[0,0]);n.__="P"+r[0]+"-"+r[1]++}return n.__},n.useImperativeHandle=function(n,t,u){f=6,T(function(){if("function"==typeof n){var u=n(t());return function(){n(null),u&&"function"==typeof u&&u()}}if(n)return n.current=t(),function(){return n.current=null}},null==u?u:u.concat(n))},n.useLayoutEffect=T,n.useMemo=_,n.useReducer=m,n.useRef=function(n){return f=5,_(function(){return{current:n}},[])},n.useState=h});
//# sourceMappingURL=hooks.umd.js.map
;
!function(n,e){"object"==typeof exports&&"undefined"!=typeof module?e(exports,require("preact"),require("preact/hooks")):"function"==typeof define&&define.amd?define('preact/compat',["exports","preact","preact/hooks"],e):e((n||self).preactCompat={},n.preact,n.preactHooks)}(this,function(n,e,t){function r(n,e){for(var t in e)n[t]=e[t];return n}function u(n,e){for(var t in n)if("__source"!==t&&!(t in e))return!0;for(var r in e)if("__source"!==r&&n[r]!==e[r])return!0;return!1}function o(n,e){var r=e(),u=t.useState({t:{__:r,u:e}}),o=u[0].t,c=u[1];return t.useLayoutEffect(function(){o.__=r,o.u=e,i(o)&&c({t:o})},[n,r,e]),t.useEffect(function(){return i(o)&&c({t:o}),n(function(){i(o)&&c({t:o})})},[n]),r}function i(n){var e,t,r=n.u,u=n.__;try{var o=r();return!((e=u)===(t=o)&&(0!==e||1/e==1/t)||e!=e&&t!=t)}catch(n){return!0}}function c(n){n()}function f(n){return n}function l(){return[!1,c]}var a=t.useLayoutEffect;function s(n,e){this.props=n,this.context=e}function h(n,t){function r(n){var e=this.props.ref,r=e==n.ref;return!r&&e&&(e.call?e(null):e.current=null),t?!t(this.props,n)||!r:u(this.props,n)}function o(t){return this.shouldComponentUpdate=r,e.createElement(n,t)}return o.displayName="Memo("+(n.displayName||n.name)+")",o.prototype.isReactComponent=!0,o.__f=!0,o}(s.prototype=new e.Component).isPureReactComponent=!0,s.prototype.shouldComponentUpdate=function(n,e){return u(this.props,n)||u(this.state,e)};var d=e.options.__b;e.options.__b=function(n){n.type&&n.type.__f&&n.ref&&(n.props.ref=n.ref,n.ref=null),d&&d(n)};var v="undefined"!=typeof Symbol&&Symbol.for&&Symbol.for("react.forward_ref")||3911;function m(n){function e(e){var t=r({},e);return delete t.ref,n(t,e.ref||null)}return e.$$typeof=v,e.render=e,e.prototype.isReactComponent=e.__f=!0,e.displayName="ForwardRef("+(n.displayName||n.name)+")",e}var p=function(n,t){return null==n?null:e.toChildArray(e.toChildArray(n).map(t))},b={map:p,forEach:p,count:function(n){return n?e.toChildArray(n).length:0},only:function(n){var t=e.toChildArray(n);if(1!==t.length)throw"Children.only";return t[0]},toArray:e.toChildArray},y=e.options.__e;e.options.__e=function(n,e,t,r){if(n.then)for(var u,o=e;o=o.__;)if((u=o.__c)&&u.__c)return null==e.__e&&(e.__e=t.__e,e.__k=t.__k),u.__c(n,e);y(n,e,t,r)};var _=e.options.unmount;function g(n,e,t){return n&&(n.__c&&n.__c.__H&&(n.__c.__H.__.forEach(function(n){"function"==typeof n.__c&&n.__c()}),n.__c.__H=null),null!=(n=r({},n)).__c&&(n.__c.__P===t&&(n.__c.__P=e),n.__c.__e=!0,n.__c=null),n.__k=n.__k&&n.__k.map(function(n){return g(n,e,t)})),n}function S(n,e,t){return n&&t&&(n.__v=null,n.__k=n.__k&&n.__k.map(function(n){return S(n,e,t)}),n.__c&&n.__c.__P===e&&(n.__e&&t.appendChild(n.__e),n.__c.__e=!0,n.__c.__P=t)),n}function E(){this.__u=0,this.o=null,this.__b=null}function C(n){var e=n.__.__c;return e&&e.__a&&e.__a(n)}function x(n){var t,r,u;function o(o){if(t||(t=n()).then(function(n){r=n.default||n},function(n){u=n}),u)throw u;if(!r)throw t;return e.createElement(r,o)}return o.displayName="Lazy",o.__f=!0,o}function O(){this.i=null,this.l=null}e.options.unmount=function(n){var e=n.__c;e&&e.__R&&e.__R(),e&&32&n.__u&&(n.type=null),_&&_(n)},(E.prototype=new e.Component).__c=function(n,e){var t=e.__c,r=this;null==r.o&&(r.o=[]),r.o.push(t);var u=C(r.__v),o=!1,i=function(){o||(o=!0,t.__R=null,u?u(c):c())};t.__R=i;var c=function(){if(!--r.__u){if(r.state.__a){var n=r.state.__a;r.__v.__k[0]=S(n,n.__c.__P,n.__c.__O)}var e;for(r.setState({__a:r.__b=null});e=r.o.pop();)e.forceUpdate()}};r.__u++||32&e.__u||r.setState({__a:r.__b=r.__v.__k[0]}),n.then(i,i)},E.prototype.componentWillUnmount=function(){this.o=[]},E.prototype.render=function(n,t){if(this.__b){if(this.__v.__k){var r=document.createElement("div"),u=this.__v.__k[0].__c;this.__v.__k[0]=g(this.__b,r,u.__O=u.__P)}this.__b=null}var o=t.__a&&e.createElement(e.Fragment,null,n.fallback);return o&&(o.__u&=-33),[e.createElement(e.Fragment,null,t.__a?null:n.children),o]};var R=function(n,e,t){if(++t[1]===t[0]&&n.l.delete(e),n.props.revealOrder&&("t"!==n.props.revealOrder[0]||!n.l.size))for(t=n.i;t;){for(;t.length>3;)t.pop()();if(t[1]<t[0])break;n.i=t=t[2]}};function w(n){return this.getChildContext=function(){return n.context},n.children}function j(n){var t=this,r=n.h;if(t.componentWillUnmount=function(){e.render(null,t.v),t.v=null,t.h=null},t.h&&t.h!==r&&t.componentWillUnmount(),!t.v){for(var u=t.__v;null!==u&&!u.__m&&null!==u.__;)u=u.__;t.h=r,t.v={nodeType:1,parentNode:r,childNodes:[],__k:{__m:u.__m},contains:function(){return!0},insertBefore:function(n,e){this.childNodes.push(n),t.h.insertBefore(n,e)},removeChild:function(n){this.childNodes.splice(this.childNodes.indexOf(n)>>>1,1),t.h.removeChild(n)}}}e.render(e.createElement(w,{context:t.context},n.__v),t.v)}function k(n,t){var r=e.createElement(j,{__v:n,h:t});return r.containerInfo=t,r}(O.prototype=new e.Component).__a=function(n){var e=this,t=C(e.__v),r=e.l.get(n);return r[0]++,function(u){var o=function(){e.props.revealOrder?(r.push(u),R(e,n,r)):u()};t?t(o):o()}},O.prototype.render=function(n){this.i=null,this.l=new Map;var t=e.toChildArray(n.children);n.revealOrder&&"b"===n.revealOrder[0]&&t.reverse();for(var r=t.length;r--;)this.l.set(t[r],this.i=[1,0,this.i]);return n.children},O.prototype.componentDidUpdate=O.prototype.componentDidMount=function(){var n=this;this.l.forEach(function(e,t){R(n,t,e)})};var T="undefined"!=typeof Symbol&&Symbol.for&&Symbol.for("react.element")||60103,I=/^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/,N=/^on(Ani|Tra|Tou|BeforeInp|Compo)/,M=/[A-Z0-9]/g,A="undefined"!=typeof document,D=function(n){return("undefined"!=typeof Symbol&&"symbol"==typeof Symbol()?/fil|che|rad/:/fil|che|ra/).test(n)};function L(n,t,r){return null==t.__k&&(t.textContent=""),e.render(n,t),"function"==typeof r&&r(),n?n.__c:null}function F(n,t,r){return e.hydrate(n,t),"function"==typeof r&&r(),n?n.__c:null}e.Component.prototype.isReactComponent={},["componentWillMount","componentWillReceiveProps","componentWillUpdate"].forEach(function(n){Object.defineProperty(e.Component.prototype,n,{configurable:!0,get:function(){return this["UNSAFE_"+n]},set:function(e){Object.defineProperty(this,n,{configurable:!0,writable:!0,value:e})}})});var U=e.options.event;function V(){}function W(){return this.cancelBubble}function P(){return this.defaultPrevented}e.options.event=function(n){return U&&(n=U(n)),n.persist=V,n.isPropagationStopped=W,n.isDefaultPrevented=P,n.nativeEvent=n};var z,B={enumerable:!1,configurable:!0,get:function(){return this.class}},H=e.options.vnode;e.options.vnode=function(n){"string"==typeof n.type&&function(n){var t=n.props,r=n.type,u={},o=-1===r.indexOf("-");for(var i in t){var c=t[i];if(!("value"===i&&"defaultValue"in t&&null==c||A&&"children"===i&&"noscript"===r||"class"===i||"className"===i)){var f=i.toLowerCase();"defaultValue"===i&&"value"in t&&null==t.value?i="value":"download"===i&&!0===c?c="":"translate"===f&&"no"===c?c=!1:"o"===f[0]&&"n"===f[1]?"ondoubleclick"===f?i="ondblclick":"onchange"!==f||"input"!==r&&"textarea"!==r||D(t.type)?"onfocus"===f?i="onfocusin":"onblur"===f?i="onfocusout":N.test(i)&&(i=f):f=i="oninput":o&&I.test(i)?i=i.replace(M,"-$&").toLowerCase():null===c&&(c=void 0),"oninput"===f&&u[i=f]&&(i="oninputCapture"),u[i]=c}}"select"==r&&u.multiple&&Array.isArray(u.value)&&(u.value=e.toChildArray(t.children).forEach(function(n){n.props.selected=-1!=u.value.indexOf(n.props.value)})),"select"==r&&null!=u.defaultValue&&(u.value=e.toChildArray(t.children).forEach(function(n){n.props.selected=u.multiple?-1!=u.defaultValue.indexOf(n.props.value):u.defaultValue==n.props.value})),t.class&&!t.className?(u.class=t.class,Object.defineProperty(u,"className",B)):(t.className&&!t.class||t.class&&t.className)&&(u.class=u.className=t.className),n.props=u}(n),n.$$typeof=T,H&&H(n)};var q=e.options.__r;e.options.__r=function(n){q&&q(n),z=n.__c};var Z=e.options.diffed;e.options.diffed=function(n){Z&&Z(n);var e=n.props,t=n.__e;null!=t&&"textarea"===n.type&&"value"in e&&e.value!==t.value&&(t.value=null==e.value?"":e.value),z=null};var Y={ReactCurrentDispatcher:{current:{readContext:function(n){return z.__n[n.__c].props.value},useCallback:t.useCallback,useContext:t.useContext,useDebugValue:t.useDebugValue,useDeferredValue:f,useEffect:t.useEffect,useId:t.useId,useImperativeHandle:t.useImperativeHandle,useInsertionEffect:a,useLayoutEffect:t.useLayoutEffect,useMemo:t.useMemo,useReducer:t.useReducer,useRef:t.useRef,useState:t.useState,useSyncExternalStore:o,useTransition:l}}},$="18.3.1";function G(n){return e.createElement.bind(null,n)}function J(n){return!!n&&n.$$typeof===T}function K(n){return J(n)&&n.type===e.Fragment}function Q(n){return!!n&&!!n.displayName&&("string"==typeof n.displayName||n.displayName instanceof String)&&n.displayName.startsWith("Memo(")}function X(n){return J(n)?e.cloneElement.apply(null,arguments):n}function nn(n){return!!n.__k&&(e.render(null,n),!0)}function en(n){return n&&(n.base||1===n.nodeType&&n)||null}var tn=function(n,e){return n(e)},rn=function(n,e){return n(e)},un=e.Fragment,on=J,cn={useState:t.useState,useId:t.useId,useReducer:t.useReducer,useEffect:t.useEffect,useLayoutEffect:t.useLayoutEffect,useInsertionEffect:a,useTransition:l,useDeferredValue:f,useSyncExternalStore:o,startTransition:c,useRef:t.useRef,useImperativeHandle:t.useImperativeHandle,useMemo:t.useMemo,useCallback:t.useCallback,useContext:t.useContext,useDebugValue:t.useDebugValue,version:$,Children:b,render:L,hydrate:F,unmountComponentAtNode:nn,createPortal:k,createElement:e.createElement,createContext:e.createContext,createFactory:G,cloneElement:X,createRef:e.createRef,Fragment:e.Fragment,isValidElement:J,isElement:on,isFragment:K,isMemo:Q,findDOMNode:en,Component:e.Component,PureComponent:s,memo:h,forwardRef:m,flushSync:rn,unstable_batchedUpdates:tn,StrictMode:un,Suspense:E,SuspenseList:O,lazy:x,__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED:Y};Object.defineProperty(n,"Component",{enumerable:!0,get:function(){return e.Component}}),Object.defineProperty(n,"Fragment",{enumerable:!0,get:function(){return e.Fragment}}),Object.defineProperty(n,"createContext",{enumerable:!0,get:function(){return e.createContext}}),Object.defineProperty(n,"createElement",{enumerable:!0,get:function(){return e.createElement}}),Object.defineProperty(n,"createRef",{enumerable:!0,get:function(){return e.createRef}}),n.Children=b,n.PureComponent=s,n.StrictMode=un,n.Suspense=E,n.SuspenseList=O,n.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=Y,n.cloneElement=X,n.createFactory=G,n.createPortal=k,n.default=cn,n.findDOMNode=en,n.flushSync=rn,n.forwardRef=m,n.hydrate=F,n.isElement=on,n.isFragment=K,n.isMemo=Q,n.isValidElement=J,n.lazy=x,n.memo=h,n.render=L,n.startTransition=c,n.unmountComponentAtNode=nn,n.unstable_batchedUpdates=tn,n.useDeferredValue=f,n.useInsertionEffect=a,n.useSyncExternalStore=o,n.useTransition=l,n.version=$,Object.keys(t).forEach(function(e){"default"===e||n.hasOwnProperty(e)||Object.defineProperty(n,e,{enumerable:!0,get:function(){return t[e]}})})});
//# sourceMappingURL=compat.umd.js.map
;
define('@oracle/oraclejet-preact/logger-0f873e29',['exports'], (function(e){"use strict";const n=(()=>{let e;try{const n=window?.sessionStorage?.getItem("ojet.logLevel");switch(n){case"none":e=0;break;case"error":e=1;break;case"warning":e=2;break;case"info":e=3;break;case"log":e=4;break;default:e=void 0}}catch(e){}return e})();let o=1,t=null;const r=()=>void 0===n?o:n,i=(e,n,o,...i)=>{if(r()<n)return;const l=(()=>{let e;return t?e=t:"undefined"!=typeof window&&void 0!==window.console&&(e=window.console),e})();if(l){let t=[o];if(i&&(t=t.concat(i)),1===t.length&&t[0]instanceof Function){const e=t[0]();t=Array.isArray(e)?e:[e]}l.write?(t.unshift(n),l.write(...t)):l[e].apply(l,t)}},l=i.bind(null,"log",4),s=i.bind(null,"info",3),a=i.bind(null,"warn",2),c=i.bind(null,"error",1);e.ERROR=1,e.INFO=3,e.LOG=4,e.NONE=0,e.WARN=2,e.error=c,e.getLogLevel=r,e.info=s,e.log=l,e.setLogLevel=e=>{o=e},e.setLogWriter=e=>{t=e},e.warn=a}));
//# sourceMappingURL=logger-0f873e29.js.map
;
define('@oracle/oraclejet-preact/utils/UNSAFE_logger',['exports', '../logger-0f873e29'], (function(e,o){"use strict";e.ERROR=o.ERROR,e.INFO=o.INFO,e.LOG=o.LOG,e.NONE=o.NONE,e.WARN=o.WARN,e.error=o.error,e.getLogLevel=o.getLogLevel,e.info=o.info,e.log=o.log,e.setLogLevel=o.setLogLevel,e.setLogWriter=o.setLogWriter,e.warn=o.warn,Object.defineProperty(e,"__esModule",{value:!0})}));
//# sourceMappingURL=UNSAFE_logger.js.map
;
/**
 * @license
 * Copyright (c) 2014, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
define('ojs/ojlogger',["exports","@oracle/oraclejet-preact/utils/UNSAFE_logger"],function(e,o){"use strict";const t={LEVEL_NONE:0,LEVEL_ERROR:1,LEVEL_WARN:2,LEVEL_INFO:3,LEVEL_LOG:4};t._defaultOptions={level:t.LEVEL_ERROR,writer:null},t._options=t._defaultOptions,t.error=o.error.bind(o),t.info=o.info.bind(o),t.warn=o.warn.bind(o),t.log=o.log.bind(o),t.option=function(e,r){var L,n,E={};if(0===arguments.length){for(n=Object.keys(t._options),L=0;L<n.length;L++)E[n[L]]="level"===n[L]?o.getLogLevel():t._options[n[L]];return E}if("string"==typeof e&&void 0===r){let r;switch(e){case"level":r=o.getLogLevel();break;case"writer":r=t._options.writer;break;default:r=null}return r}if("string"==typeof e)"level"===e?o.setLogLevel(r):"writer"===e&&(o.setLogWriter(r),t._options[e]=r);else{var i=e;for(n=Object.keys(i),L=0;L<n.length;L++)t.option(n[L],i[n[L]])}};const r=t.info,L=t.error,n=t.warn,E=t.log,i=t.option,l=t.LEVEL_ERROR,_=t.LEVEL_INFO,s=t.LEVEL_LOG,f=t.LEVEL_NONE,O=t.LEVEL_WARN;e.LEVEL_ERROR=l,e.LEVEL_INFO=_,e.LEVEL_LOG=s,e.LEVEL_NONE=f,e.LEVEL_WARN=O,e.error=L,e.info=r,e.log=E,e.option=i,e.warn=n,Object.defineProperty(e,"__esModule",{value:!0})});
//# sourceMappingURL=ojlogger.js.map;
/**
 * @license
 * Copyright (c) 2014, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
define('ojs/ojwebdrivertest-proxy',["require","exports"],function(e,t){"use strict";function o(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(o){var n=Object.getOwnPropertyDescriptor(e,o);Object.defineProperty(t,o,n.get?n:{enumerable:!0,get:function(){return e[o]}})}),t.default=e,t}const n={BusyContext:()=>new Promise(function(t,n){e(["ojs/ojcontext"],function(e){t(o(e))},n)}).then(({default:e})=>e.getPageContext().getBusyContext()),Chai:()=>new Promise(function(t,n){e(["chai"],function(e){t(o(e))},n)}).then(({default:e})=>e),Core:()=>new Promise(function(t,n){e(["ojs/ojcore-base"],function(e){t(o(e))},n)}).then(({default:e})=>e),CspExpressionEvaluator:()=>new Promise(function(t,n){e(["ojs/ojcspexpressionevaluator"],function(e){t(o(e))},n)}).then(({default:e})=>e),CustomElementUtils:()=>new Promise(function(t,n){e(["ojs/ojcustomelement-utils"],function(e){t(o(e))},n)}).then(({CustomElementUtils:e})=>e),KeySet:()=>new Promise(function(t,n){e(["ojs/ojkeyset"],function(e){t(o(e))},n)}),KeyUtils:()=>new Promise(function(t,n){e(["ojs/ojcore-base"],function(e){t(o(e))},n)}).then(({default:{KeyUtils:e}})=>e),Knockout:()=>new Promise(function(t,n){e(["knockout"],function(e){t(o(e))},n)})},r={};function i(...e){return Promise.all(e.map(e=>{if(!n[e])throw Error(`module "${e}" does not exist in test proxy`);const t=r[e];return t?Promise.resolve(t):(console.log(`getProxy importing ${e}`),n[e]().then(t=>(r[e]=t,t)))}))}function u(...e){return e.map(e=>r[e])}"undefined"!=typeof window&&(window.__ojwebdrivertest_proxy={getProxy:i,getCachedModules:u}),t.getCachedModules=u,t.getProxy=i,Object.defineProperty(t,"__esModule",{value:!0})});
//# sourceMappingURL=ojwebdrivertest-proxy.js.map;
/**
 * @license
 * Copyright (c) 2014, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
define('ojs/ojcore-base',["ojs/ojlogger","ojs/ojwebdrivertest-proxy"],function(e,t){"use strict";let n={};"undefined"!=typeof window?n=window:"undefined"!=typeof self&&(n=self);var r=n.oj;const o={version:"19.0.6",revision:"2026-04-30_13-32-19",noConflict:function(){n.oj=r},_registerLegacyNamespaceProp:function(e,t){this[e]=t}};n.oj=o;const i={};o._registerLegacyNamespaceProp("StringUtils",i),i._TRIM_ALL_RE=/^\s*|\s*$/g,i.isEmpty=function(e){return null===e||0===i.trim(e).length},i.isEmptyOrUndefined=function(e){return!(void 0!==e&&!i.isEmpty(e))},i.isString=function(e){return null!==e&&("string"==typeof e||e instanceof String)},i.trim=function(e){return i.isString(e)?e.replace(i._TRIM_ALL_RE,""):e},i.hashCode=function(e){var t=0;if(0===e.length)return t;for(var n=0;n<e.length;n++){t=(t<<5)-t+e.charCodeAt(n),t&=t}return t};const s=function(){};o._registerLegacyNamespaceProp("AgentUtils",s),s.BROWSER={IE:"ie",FIREFOX:"firefox",SAFARI:"safari",CHROME:"chrome",EDGE:"edge",EDGE_CHROMIUM:"edge-chromium",UNKNOWN:"unknown"},s.ENGINE={TRIDENT:"trident",WEBKIT:"webkit",GECKO:"gecko",BLINK:"blink",EDGE_HTML:"edgehtml",UNKNOWN:"unknown"},s.OS={WINDOWS:"Windows",SOLARIS:"Solaris",MAC:"Mac",UNKNOWN:"Unknown",ANDROID:"Android",IOS:"IOS",WINDOWSPHONE:"WindowsPhone",LINUX:"Linux"},s.DEVICETYPE={PHONE:"phone",TABLET:"tablet",OTHERS:"others"},s.getAgentInfo=function(e){i.isEmptyOrUndefined(e)&&(e=navigator.userAgent),e=e.toLowerCase();var t=i.hashCode(e),n=s._currAgentInfo;if(n&&n.hashCode===t)return{os:n.os,browser:n.browser,browserVersion:n.browserVersion,deviceType:n.deviceType,engine:n.engine,engineVersion:n.engineVersion,hashCode:n.hashCode};var r=s.OS.UNKNOWN,o=s.BROWSER.UNKNOWN,a=0,c=s.DEVICETYPE.OTHERS,u=s.ENGINE.UNKNOWN,l=0;return e.indexOf("iphone")>-1||e.indexOf("ipad")>-1||e.indexOf("macintosh")>-1&&navigator.maxTouchPoints>0?r=s.OS.IOS:e.indexOf("macintosh")>-1?r=s.OS.MAC:e.indexOf("sunos")>-1?r=s.OS.SOLARIS:e.indexOf("android")>-1?r=s.OS.ANDROID:e.indexOf("linux")>-1?r=s.OS.LINUX:e.indexOf("windows phone")>-1?r=s.OS.WINDOWSPHONE:e.indexOf("windows")>-1&&(r=s.OS.WINDOWS),r===s.OS.ANDROID?c=e.indexOf("mobile")>-1?s.DEVICETYPE.PHONE:s.DEVICETYPE.TABLET:r===s.OS.IOS&&(c=e.indexOf("iphone")>-1?s.DEVICETYPE.PHONE:s.DEVICETYPE.TABLET),e.indexOf("msie")>-1?(o=s.BROWSER.IE,a=s._parseFloatVersion(e,/msie (\d+[.]\d+)/),e.indexOf("trident")&&(u=s.ENGINE.TRIDENT,l=s._parseFloatVersion(e,/trident\/(\d+[.]\d+)/))):e.indexOf("trident")>-1?(o=s.BROWSER.IE,a=s._parseFloatVersion(e,/rv:(\d+[.]\d+)/),e.indexOf("trident")&&(u=s.ENGINE.TRIDENT,l=s._parseFloatVersion(e,/trident\/(\d+[.]\d+)/))):e.indexOf("edge")>-1?(o=s.BROWSER.EDGE,a=l=s._parseFloatVersion(e,/edge\/(\d+[.]\d+)/),u=s.ENGINE.EDGE_HTML):e.indexOf("edg")>-1?(o=s.BROWSER.EDGE_CHROMIUM,a=s._parseFloatVersion(e,/edg\/(\d+[.]\d+)/),u=s.ENGINE.BLINK,l=a):e.indexOf("chrome")>-1?(o=s.BROWSER.CHROME,(a=s._parseFloatVersion(e,/chrome\/(\d+[.]\d+)/))>=28?(u=s.ENGINE.BLINK,l=a):(u=s.ENGINE.WEBKIT,l=s._parseFloatVersion(e,/applewebkit\/(\d+[.]\d+)/))):e.indexOf("safari")>-1?(o=s.BROWSER.SAFARI,a=s._parseFloatVersion(e,/version\/(\d+[.]\d+)/),u=s.ENGINE.WEBKIT,l=s._parseFloatVersion(e,/applewebkit\/(\d+[.]\d+)/)):e.indexOf("firefox")>-1&&(o=s.BROWSER.FIREFOX,a=s._parseFloatVersion(e,/rv:(\d+[.]\d+)/),u=s.ENGINE.GECKO,l=s._parseFloatVersion(e,/gecko\/(\d+)/)),s._currAgentInfo=n={hashCode:t,os:r,browser:o,browserVersion:a,deviceType:c,engine:u,engineVersion:l},{os:n.os,browser:n.browser,browserVersion:n.browserVersion,deviceType:n.deviceType,engine:n.engine,engineVersion:n.engineVersion,hashCode:n.hashCode}},s._parseFloatVersion=function(e,t){var n=e.match(t);if(n){var r=n[1];if(r)return parseFloat(r)}return 0};const a={};o._registerLegacyNamespaceProp("Assert",a);var c="DEBUG";const u="' doesn't match prototype ";a.forceDebug=function(){a[c]=!0},a.clearDebug=function(){a[c]=!1},a.isDebug=function(){return!0===a[c]},a.assert=function(e,t){if(a[c]&&!e){var n=t||"";if(arguments.length>2){n+="(";for(var r=2;r<arguments.length;r+=1)n+=arguments[r];n+=")"}a.assertionFailed(n,1)}},a.failedInAbstractFunction=function(){a[c]&&a.assertionFailed("Abstract function called",1)},a.assertPrototype=function(e,t,n){if(a[c]){var r=t.prototype;if(null!=e)a.assertType(t,"function",null,1,!1),Object.prototype.isPrototypeOf.call(r,e)||a.assertionFailed("object '"+e+u+r,1,n);else a.assertionFailed("null object doesn't match prototype "+r,1,n)}},a.assertPrototypeOrNull=function(e,t,n){if(a[c]&&null!=e){a.assertType(t,"function",null,1,!1);var r=t.prototype;Object.prototype.isPrototypeOf.call(r,e)||a.assertionFailed("object '"+e+u+r,1,n)}},a.assertPrototypes=function(e,t,n,r){if(a[c]){var o=t.prototype,i=n.prototype,s=Object.prototype.isPrototypeOf;s.call(o,e)||s.call(i,e)||a.assertionFailed("object '"+e+u+o+" or "+i,1,r)}},a.assertDomNodeOrNull=function(e,t){a[c]&&e&&void 0===e.nodeType&&a.assertionFailed(e+" is not a DOM Node",t+1)},a.assertDomNode=function(e,t){a[c]&&(e&&void 0!==e.nodeType||a.assertionFailed(e+" is not a DOM Node",t+1))},a.assertDomElement=function(e,t){a[c]&&(a.assertDomNode(e,1),1!==e.nodeType?a.assertionFailed(e+" is not a DOM Element",1):t&&e.nodeName!==t&&a.assertionFailed(e+" is not a "+t+" Element",1))},a.assertDomElementOrNull=function(e,t){a[c]&&null!=e&&(a.assertDomNode(e,1),1!==e.nodeType?a.assertionFailed(e+" is not a DOM Element",1):t&&e.nodeName!==t&&a.assertionFailed(e+" is not a "+t+" Element",1))},a.assertType=function(e,t,n,r,o){if(a[c]&&!(null==e&&o||typeof e===t)){var i=e+" is not of type "+t;n&&(i=n+i),r||(r=0),a.assertionFailed(i,r+1)}},a.assertObject=function(e,t){a[c]&&a.assertType(e,"object",t,1,!1)},a.assertObjectOrNull=function(e,t){a[c]&&a.assertType(e,"object",t,1,!0)},a.assertNonEmptyString=function(e,t){a[c]&&(a.assertType(e,"string",t,1,!1),a.assert(e.length>0,"empty string"))},a.assertString=function(e,t){a[c]&&a.assertType(e,"string",t,1,!1)},a.assertStringOrNull=function(e,t){a[c]&&a.assertType(e,"string",t,1,!0)},a.assertFunction=function(e,t){a[c]&&a.assertType(e,"function",t,1,!1)},a.assertFunctionOrNull=function(e,t){a[c]&&a.assertType(e,"function",t,1,!0)},a.assertBoolean=function(e,t){a[c]&&a.assertType(e,"boolean",t,1,!1)},a.assertNumber=function(e,t){a[c]&&a.assertType(e,"number",t,1,!1)},a.assertNumberOrNull=function(e,t){a[c]&&a.assertType(e,"number",t,1,!0)},a.assertArray=function(e,t){a[c]&&(Array.isArray(e)||(void 0===t&&(t=e+" is not an array"),a.assertionFailed(t,1)))},a.assertArrayOrNull=function(e,t){a[c]&&null!=e&&(Array.isArray(e)||(void 0===t&&(t=e+" is not an array"),a.assertionFailed(t,1)))},a.assertNonNumeric=function(e,t){a[c]&&(isNaN(e)||(void 0===t&&(t=e+" is convertible to a number"),a.assertionFailed(t,1)))},a.assertNumeric=function(e,t){a[c]&&isNaN(e)&&(void 0===t&&(t=e+" is not convertible to a number"),a.assertionFailed(t,1))},a.assertInSet=function(e,t,n){if(null==e||void 0===t[e.toString()]){if(void 0===n){for(var r=" is not in set: {",o=Object.keys(t),i=0;i<o.length;i++){r+=o[i],r+=","}n=e+(r+="}")}a.assertionFailed(n,1)}},a.assertionFailed=function(e,t,n){t||(t=0);var r="Assertion";throw n&&(r+=" ("+n+")"),r+=" failed: ",void 0!==e&&(r+=e),new Error(r)};var l=n.__oj_Assert_DEBUG;void 0!==l&&(a[c]=l),s.getAgentInfo().browser===s.BROWSER.IE&&e.error("Internet Explorer is not supported with this version of JET.");const d={};o._registerLegacyNamespaceProp("CollectionUtils",d),d.copyInto=function(e,t,n,r,o){return d._copyIntoImpl(e,t,n,r,o,0)},d.mergeDeep=function(e,...t){if(!t.length)return e;const n=d.isPlainObject,r=d.mergeDeep,o=t.shift();return n(e)&&n(o)&&Object.keys(o).forEach(t=>{n(o[t])?(e[t]||Object.assign(e,{[t]:{}}),r(e[t],o[t])):Object.assign(e,{[t]:o[t]})}),r(e,...t)},d.isPlainObject=function(e){if(null!==e&&"object"==typeof e)try{var t=Object.prototype.hasOwnProperty;if(e.constructor&&t.call(e.constructor.prototype,"isPrototypeOf"))return!0}catch(e){}return!1},d._copyIntoImpl=function(e,t,n,r,o,i){var s;if(null==o&&(o=Number.MAX_VALUE),e&&t&&e!==t)for(var a=Object.keys(t),c=0;c<a.length;c++){var u=a[c];s=n?n(u):u;var l=t[u],f=!1;if(r&&i<o){var p=e[s];d.isPlainObject(l)&&(null==p||d.isPlainObject(p))&&(f=!0,e[s]=p||{},d._copyIntoImpl(e[s],l,n,!0,o,i+1))}f||(e[s]=l)}return e},"undefined"!=typeof window&&window.Element&&!Element.prototype.closest&&(Element.prototype.closest=function(e){var t,n=(this.document||this.ownerDocument).querySelectorAll(e),r=this;do{for(t=n.length;--t>=0&&n.item(t)!==r;);}while(t<0&&(r=r.parentElement));return r}),function(){function e(e){return function(t,n,r){return e.call(this,t,n,function(e){return"boolean"==typeof e?e:!!e&&e.capture}(r))}}if("undefined"!=typeof window&&!function(){let e=!1;try{var t=Object.defineProperty({},"passive",{get:function(){return e=!0,e}});window.addEventListener("testPassive",null,t),window.removeEventListener("testPassive",null,t)}catch(e){}return e}()){let t;window.EventTarget?t=EventTarget.prototype:window.Node&&(t=Node.prototype),t&&(t.addEventListener=e(t.addEventListener),t.removeEventListener=e(t.removeEventListener))}}(),
/**
     * @license
     * Code taken from
     * https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/queueMicrotask
     * under "When queueMicrotask() isn't available".
     * @ignore
     */
"undefined"!=typeof window&&"function"!=typeof window.queueMicrotask&&(window.queueMicrotask=function(e){Promise.resolve().then(e).catch(function(e){setTimeout(function(){throw e})})}),function(){if("undefined"!=typeof window){var e;if(!((e=document.createEvent("Event")).initEvent("foo",!0,!0),e.preventDefault(),e.defaultPrevented)){var t=Event.prototype.preventDefault;Event.prototype.preventDefault=function(){this.cancelable&&(t.call(this),Object.defineProperty(this,"defaultPrevented",{get:function(){return!0},configurable:!0}))}}"function"!=typeof window.CustomEvent&&(n.prototype=Object.getPrototypeOf(new n("bogusEvent")),window.CustomEvent=n)}function n(e,t){t=t||{bubbles:!1,cancelable:!1,detail:void 0};var n=document.createEvent("CustomEvent");return n.initCustomEvent(e,t.bubbles,t.cancelable,t.detail),n}}(),function(){function e(e){var t=document.createEvent("FocusEvent");return t.initEvent(e,!1,!1),t}"undefined"!=typeof window&&"function"!=typeof window.FocusEvent&&(e.prototype=Object.getPrototypeOf(new e("focus")),window.FocusEvent=e)}(),function(){var e,t;"undefined"!=typeof window&&!window.setImmediate&&window.postMessage&&(window.setImmediate=function(){var r=arguments[0],o=Array.prototype.slice.call(arguments,1);a.assertFunction(r);var i=(isNaN(t)&&(t=0),t+=1);return e||(e=new Map),e.set(i,{callback:r,args:o}),1===e.size&&window.addEventListener("message",n),window.postMessage({id:i,message:"oj-setImmediate"},"*"),i},window.clearImmediate=r);function n(t){var n=t.data;if(n&&"oj-setImmediate"===n.message){var o=n.id,i=e.get(o);if(r(o),i){var s=i.callback,a=i.args;s.apply(window,a)}}}function r(t){e&&(e.delete(t),e.size<1&&(window.removeEventListener("message",n),e=null))}}(),"undefined"!=typeof window&&(window.Symbol?(window.Symbol.asyncIterator||(window.Symbol.asyncIterator="asyncIterator"),window.Symbol.iterator||(window.Symbol.iterator="iterator")):(window.Symbol={},window.Symbol.asyncIterator="asyncIterator",window.Symbol.iterator="iterator")),function(){if("undefined"!=typeof window&&0===new window.Set([0]).size){var e=window.Set;function t(t){var n=new e;return t&&t.forEach(n.add,n),n}t.prototype=e.prototype,t.prototype.constructor=t,window.Set=t}}(),"undefined"!=typeof window&&(window.NodeList&&!NodeList.prototype.forEach&&(NodeList.prototype.forEach=Array.prototype.forEach),window.DOMTokenList&&!DOMTokenList.prototype.forEach&&(DOMTokenList.prototype.forEach=Array.prototype.forEach)),"undefined"!=typeof window&&"undefined"!==window.Node&&("isConnected"in Node.prototype||Object.defineProperty(Node.prototype,"isConnected",{get(){return!(this.ownerDocument&&this.ownerDocument.compareDocumentPosition(this)&this.DOCUMENT_POSITION_DISCONNECTED)}}));const f=function(){this.Init()};o._registerLegacyNamespaceProp("Object",f),f.superclass=null,f._typeName="oj.Object",f._GET_FUNCTION_NAME_REGEXP=/function\s+([\w$][\w$\d]*)\s*\(/,f.prototype={},f.prototype.constructor=f,f.createSubclass=function(e,t,n){a.assertFunction(e),a.assertFunctionOrNull(t),a.assertStringOrNull(n),void 0===t&&(t=f),a.assert(e!==t,"Class can't extend itself");var r=f._tempSubclassConstructor;r.prototype=t.prototype,e.prototype=new r,e.prototype.constructor=e,e.superclass=t.prototype,n&&(e._typeName=n)},f.copyPropertiesForClass=function(e,t){a.assertFunction(e),a.assert(null!=t,"source object cannot be null");for(var n=Object.keys(t),r=0;r<n.length;r++){var o=n[r];e.prototype[o]=t[o]}},f._tempSubclassConstructor=function(){},f.prototype.getClass=function(e){if(void 0===e)e=this;else if(null===e)return null;return e.constructor},f.prototype.clone=function(){var e=new this.constructor;return d.copyInto(e,this),e},f.prototype.toString=function(){return this.toDebugString()},f.prototype.toDebugString=function(){return this.getTypeName()+" Object"},f.getTypeName=function(e){a.assertFunction(e);var t=e._typeName;if(null==t){var n=e.toString(),r=f._GET_FUNCTION_NAME_REGEXP.exec(n);t=r?r[1]:"anonymous",e._typeName=t}return t},f.prototype.getTypeName=function(){return f.getTypeName(this.constructor)},f.prototype.Init=function(){a.isDebug()&&a.assert(this.getTypeName,"Not an oj.Object");var e=this.constructor;e._initialized||f._initClasses(e)},f.ensureClassInitialization=function(e){a.assertFunction(e),e._initialized||f._initClasses(e)},f.prototype.equals=function(e){return this===e},f.createCallback=function(e,t){return a.assertFunction(t),t.bind(e)},f._initClasses=function(e){a.isDebug()&&(a.assertFunction(e),a.assert(!e._initialized)),e._initialized=!0;var t=e.superclass;if(t){var n=t.constructor;n&&!n._initialized&&f._initClasses(n)}var r=e.InitClass;r&&r.call(e)},f.compareValues=function(t,n){if(t===n)return!0;if(typeof t!==typeof n)return!1;if(null===t||null===n)return!1;try{if(t.constructor===n.constructor){if(Array.isArray(t))return f._compareArrayValues(t,n);if(t.constructor===Object){const e=arguments[2]||new Set;return f.__innerEquals(t,n,e)}if(t.valueOf&&"function"==typeof t.valueOf)return t.valueOf()===n.valueOf()}}catch(t){e.log("Object.compareValues() exception",t)}return!1},f._compareArrayValues=function(e,t){if(e.length!==t.length)return!1;for(var n=0,r=e.length;n<r;n++)if(!f.compareValues(e[n],t[n]))return!1;return!0},f._compareIdIndexObject=function(e,t){if("number"==typeof e&&"number"==typeof t||"string"==typeof e&&"string"==typeof t)return e===t;if("object"==typeof e&&"object"==typeof t){if(e.id&&t.id)return e.id===t.id&&(!e.index||!t.index||e.index===t.index);if(e.index&&t.index)return e.index===t.index}return!1},f._compareArrayIdIndexObject=function(e,t){if(!e)return!t||0===t.length;if(!t)return!e||0===e.length;if(e.length!==t.length)return!1;for(var n=0;n<e.length;n++){for(var r=!1,o=0;o<t.length;o++)if(f._compareIdIndexObject(e[n],t[o])){r=!0;break}if(!r)return!1}return!0},f.__innerEquals=function(t,n,r=new Set){if(t===n)return!0;if(r.has(t)||r.has(n))return e.warn("cyclic dependency detected",t,n),!1;if(r.add(t),r.add(n),!(t instanceof Object&&n instanceof Object))return!1;if(t.constructor!==n.constructor)return!1;var o,i,s=Object.prototype.hasOwnProperty,a=Object.keys(t);for(i=0;i<a.length;i++)if(o=a[i],s.call(t,o)){if(!s.call(n,o))return!1;if(t[o]!==n[o]){if("object"!=typeof t[o])return!1;if(!f.compareValues(t[o],n[o],r))return!1}}var c=Object.keys(n);for(i=0;i<c.length;i++)if(o=c[i],s.call(n,o)&&!s.call(t,o))return!1;return 0!==a.length||0!==c.length||JSON.stringify(t)===JSON.stringify(n)},f.isEmpty=function(e){var t;if(null==e)return!0;for(t in e)if(e.hasOwnProperty(t))return!1;return!0};const p=function(){this.Init()};f.createSubclass(p,f,"oj.EventSource"),o._registerLegacyNamespaceProp("EventSource",p),p.prototype.Init=function(){this._eventHandlers=[],p.superclass.Init.call(this)},p.prototype.on=function(e,t){for(var n=!1,r=0;r<this._eventHandlers.length;r++)if(this._eventHandlers[r].eventType===e&&this._eventHandlers[r].eventHandlerFunc===t){n=!0;break}n||this._eventHandlers.push({eventType:e,eventHandlerFunc:t})},p.prototype.off=function(e,t){for(var n=this._eventHandlers.length-1;n>=0;n--)if(this._eventHandlers[n].eventType===e&&this._eventHandlers[n].eventHandlerFunc===t){this._eventHandlers.splice(n,1);break}},p.prototype.handleEvent=function(e,t){for(var n=0;n<this._eventHandlers.length;n++){var r=this._eventHandlers[n];if(r.eventType===e&&!1===r.eventHandlerFunc.apply(this,Array.prototype.slice.call(arguments).slice(1)))return!1}return!0};const y={};o._registerLegacyNamespaceProp("KeyUtils",y),y.equals=function(e,t){return f.compareValues(e,t)};var E=n.__ojCheckpointManager;const v={};return o._registerLegacyNamespaceProp("CHECKPOINT_MANAGER",v),v.startCheckpoint=function(e,t){E&&E.startCheckpoint(e,t)},v.endCheckpoint=function(e){E&&E.endCheckpoint(e)},v.getRecord=function(e){return E?E.getRecord(e):void 0},v.matchRecords=function(e){return E?E.matchRecords(e):[]},v.dump=function(t){e.info(function(){for(var e="Checkpoint Records:",n=v.matchRecords(t),r=0;r<n.length;r++){var o=n[r];e=e+"\n"+o.name;var i=o.description;null!=i&&(e=e+" ("+i+")"),e=(e+=":\n")+"start: "+o.start+"\tduration: "+o.duration}return e})},o});
//# sourceMappingURL=ojcore-base.js.map;
/**
 * @license
 * Copyright (c) 2014, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
define('ojs/ojcustomelement-registry',["exports"],function(e){"use strict";const t={};function n(e){return e.toLowerCase().match(/-(?<match>.*)/)[0].replace(/-(.)/g,(e,t)=>t.toUpperCase())+"Element"}function r(e){return t[e]??null}function o(e){return r(e)?.descriptor||{}}function i(e){const t=o(e);return t._metadata??t.metadata??{}}function s(e){return i(e).properties??{}}e.getElementDescriptor=o,e.getElementProperties=function(e){return s(e.tagName)},e.getElementRegistration=r,e.getMetadata=i,e.getPropertiesForElementTag=s,e.isComposite=function(e){return r(e)?.composite??!1},e.isElementRegistered=function(e){return null!=t[e]},e.isVComponent=function(e){return r(e)?.vcomp??!1},e.registerElement=function(e,r,o){const i=e.toUpperCase();if(!t[i]){if(!r.descriptor)throw new Error(`Custom element ${e} must be registered with a descriptor.`);t[e]=r,t[i]=r,Object.defineProperty(o,"name",{value:n(e)}),customElements.define(e,o)}},e.tagNameToElementClassName=n,Object.defineProperty(e,"__esModule",{value:!0})});
//# sourceMappingURL=ojcustomelement-registry.js.map;
/**
 * @license
 * Copyright (c) 2014, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
define('ojs/ojcontext',["ojs/ojcore-base","ojs/ojlogger","ojs/ojcustomelement-registry"],function(e,t,s){"use strict";e=e&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e;const o=function(e,t){this._description=e,this._stack=t,this._addedWaitTs=o._getTs(),this._id=this._addedWaitTs.toString(36)+"_"+Math.random().toString(36)};e._registerLegacyNamespaceProp("BusyState",o),Object.defineProperties(o.prototype,{id:{get:function(){return this._id},enumerable:!0},description:{get:function(){if(this._description)return this._description instanceof Function?this._description():this._description.toString()},enumerable:!0},stack:{get:function(){if(this._stack)return this._stack},enumerable:!0}}),o.prototype.toString=function(){var e="Busy state: [description=",t=this.description;return null!==t&&(e+=t),this.stack&&(e+=`\n${this.stack}`),e+=", elapsed="+(o._getTs()-this._addedWaitTs)+"]"},o._getTs=function(){return window.performance?window.performance.now():(new Date).getTime()};const n=function(e,t){this.Init(e,t)};let i;function r(){return i||(i=new Promise(function(e){window.setImmediate(function(){i=null,e(!0)})})),i}e.Object.createSubclass(n,e.Object,"oj.BusyContext"),e._registerLegacyNamespaceProp("BusyContext",n),n._defaultTimeout=Number.NaN,n.__preactPromisesMap=new Map,n.setDefaultTimeout=function(e){isNaN(e)||(n._defaultTimeout=e)},n.prototype.Init=function(e,t){n.superclass.Init.call(this),this._hostNode=e,this._context=t,this._statesMap=new Map,this._preactSet=new Set,this._mediator={getMasterWhenReadyPromise:function(){return this._masterWhenReadyPromise||(this._masterWhenReadyPromise=new Promise(this._captureWhenReadyPromiseResolver.bind(this))),this._masterWhenReadyPromise},resolveMasterWhenReadyPromise:function(){this._masterWhenReadyPromiseResolver&&this._masterWhenReadyPromiseResolver(!0),this._masterWhenReadyPromise=null,this._masterWhenReadyPromiseResolver=null,this._masterWhenReadyPromiseRejecter=null},rejectMasterWhenReadyPromise:function(e){this._masterWhenReadyPromiseRejecter&&this._masterWhenReadyPromiseRejecter(e),this._masterWhenReadyPromise=null,this._masterWhenReadyPromiseRejecter=null,this._masterWhenReadyPromiseResolver=null},getSlaveTimeoutPromise:function(e,t,s){var o,n=new Promise(function(e,n){o=window.setTimeout(function(){n(t())},s)});return this._slaveTimeoutPromiseTimers.push(o),e.catch(()=>{}).finally(()=>this._clearAllSlaveTimeouts()),Promise.race([e,n])},_clearAllSlaveTimeouts:function(){var e=this._slaveTimeoutPromiseTimers;this._slaveTimeoutPromiseTimers=[];for(var t=0;t<e.length;t++)window.clearTimeout(e[t]);return!0},_captureWhenReadyPromiseResolver:function(e,t){this._masterWhenReadyPromiseResolver=e,this._masterWhenReadyPromiseRejecter=t},_slaveTimeoutPromiseTimers:[]}},n._log=function(e){if(t.option("level")===t.LEVEL_LOG){t.log(">> Busy states: %d",e.size);var s=n._values(e);s.length>0&&t.log(s.join("\n"))}},n._values=function(e){var t=[];return e.forEach(function(e){t.push(e)}),t};class a extends Error{constructor(e){super(e),this.name="BusyStateTrace"}}n.prototype.addBusyState=function(e){t.log("BusyContext.addBusyState: start scope='%s'",this._getDebugScope());let s;if("on"===window?.sessionStorage?.getItem("ojet.busyContextTracing"))try{throw new a("")}catch(e){s=e.stack}var i=new o(e[n._DESCRIPTION],s);return t.log(">> "+i),this._statesMap.set(i.id,i),this._addBusyStateToParent(),t.log("BusyContext.addBusyState: end scope='%s'",this._getDebugScope()),this._removeBusyState.bind(this,i)},n.prototype.dump=function(e){t.info("BusyContext.dump: start scope='%s' %s",this._getDebugScope(),e||"");var s=this._statesMap;t.info(">> Busy states: %d",s.size);var o=n._values(s);o.length>0&&t.info(o.join("\n")),t.info("BusyContext.dump: start scope='%s' %s",this._getDebugScope(),e||"")},n.prototype.getBusyStates=function(){return n._values(this._statesMap)},n.prototype.clear=function(){t.log("BusyContext.clear: start scope='%s'",this._getDebugScope());for(var e=n._values(this._statesMap),s=0;s<e.length;s++){var o=e[s];try{this._removeBusyState(o)}catch(e){t.log("BusyContext.clear: %o",e)}Object.defineProperty(o,n._OJ_RIP,{value:!0,enumerable:!1})}t.log("BusyContext.clear: end scope='%s'",this._getDebugScope())},n.prototype.whenReady=function(e){var s=this._getDebugScope();t.log("BusyContext.whenReady: start, scope='%s', timeout=%d",s,e);var o=this._statesMap,i=this._mediator,r=n._BOOTSTRAP_MEDIATOR.whenReady();const a=i.getMasterWhenReadyPromise();var u=r.then(function(){return t.log("BusyContext.whenReady: bootstrap mediator ready scope=%s",s),this._evalBusyness(),t.log("BusyContext.whenReady: busy states returning master scope=%s",s),a}.bind(this));if(isNaN(e)&&!isNaN(n._defaultTimeout)&&(e=n._defaultTimeout),!isNaN(e)){u=i.getSlaveTimeoutPromise(u,function(){var i,r="whenReady timeout of "+e+"ms expired ";n._log(o);var a=n._values(o);return(i=n._BOOTSTRAP_MEDIATOR.isReady()?new Error(r+"with the following busy states: "+a.join(", ")):new Error(r+'while the application is loading. Busy state enabled by setting the "window.oj_whenReady = true;" global variable. Application bootstrap busy state is released by calling "oj.Context.getPageContext().getBusyContext().applicationBootstrapComplete();".')).busyStates=a,t.log("BusyContext.whenReady: rejected scope='%s'\n%s",s,i.message),i},e)}return t.log("BusyContext.whenReady: end scope='%s'",this._getDebugScope()),u},n.prototype.isReady=function(){t.log("BusyContext.isReady: start scope='%s'",this._getDebugScope());var e=!1;return n._BOOTSTRAP_MEDIATOR.isReady()&&!this._doubleCheckPend&&(e=this._hasNoBusyStates(),n._log(this._statesMap)),t.log("BusyContext.isReady: end scope='%s'",this._getDebugScope()),e},n.prototype._removeBusyState=function(e){var s=this._getDebugScope();if(t.log("BusyContext._removeBusyState: start scope='%s'",s),e[n._OJ_RIP])t.log("Busy state has been forcefully resolved via clear:\n"+e);else{if(!this._statesMap.delete(e.id))throw new Error("Busy state has already been resolved:\n"+e);t.log("BusyContext._removeBusyState: resolving busy state:\n"+e),this._evalBusyness(),t.log("BusyContext._removeBusyState: end scope='%s'",s)}},n.prototype._evalBusyness=function(){var e=this._getDebugScope();t.log("BusyContext._evalBusyness: begin scope='%s'",e),this._hasNoBusyStates()&&!this._doubleCheckPend&&(t.log("BusyContext._evalBusyness: macrotask to double-check busyness, scope='%s'",e),this._doubleCheckPend=!0,r().then(this._doubleCheckBusyness.bind(this))),t.log("BusyContext._evalBusyness: end scope='%s'",e)},n.prototype._hasNoBusyStates=function(){return this._syncDebounceBusyness(),0===this._statesMap.size},n.prototype._syncDebounceBusyness=function(){n.__preactPromisesMap.forEach((e,t)=>{if(t&&!this._preactSet.has(t)){this._preactSet.add(t);const s=this.addBusyState({description:e});t.then(()=>{this._preactSet.delete(t),s()})}})},n.prototype._doubleCheckBusyness=function(){var e=this._getDebugScope();t.log("BusyContext._doubleCheckBusyness: begin scope='%s'",e);try{n._deliverThrottledUpdates()}catch(e){return t.error("Fatal exception delivering binding updates: %o",e),this._doubleCheckPend=!1,void this._rejectWhenReadyPromises(e)}this._doubleCheckPend=!1,this._hasNoBusyStates()?(t.log("BusyContext._doubleCheckBusyness: resolving whenReady promises"),this._mediator.resolveMasterWhenReadyPromise(),this._resolveBusyStateForParent()):n._log(this._statesMap),t.log("BusyContext._doubleCheckBusyness: end scope='%s'",e)},n.prototype.applicationBootstrapComplete=function(){var e=this._getDebugScope();t.log("BusyContext.applicationBootstrapComplete: begin scope='%s'",e),n._BOOTSTRAP_MEDIATOR.notifyComplete(),t.log("BusyContext.applicationBootstrapComplete: end scope='%s'",e)},n.prototype._getParentBusyContext=function(){var e=this._context.getParentContext();return e?e.getBusyContext():null},n.prototype._addBusyStateToParent=function(){if(!this._parentNotified){this._parentNotified=!0;var e=this._getParentBusyContext();if(e){var t={};t[n._DESCRIPTION]=this.toString.bind(this),this._parentResolveCallback=e.addBusyState(t)}}},n.prototype._resolveBusyStateForParent=function(){this._parentNotified=!1,this._parentResolveCallback&&(this._parentResolveCallback(),this._parentResolveCallback=null)},n.prototype._rejectWhenReadyPromises=function(e){this._mediator.rejectMasterWhenReadyPromise(e);const t=this._getParentBusyContext();t&&(t._rejectWhenReadyPromises(e),this._resolveBusyStateForParent())},n.prototype._getCompoundDescription=function(){return"["+n._values(this._statesMap).join(", ")+"]"},n.prototype._getDebugScope=function(){function e(e){var t="undefined";if(e)if(e.id&&e.id.length>0)t="#"+e.id;else{t=e.nodeName,e.hasAttribute("data-oj-context")&&(t+="[data-oj-context]");var s=e.getAttribute("class");s&&(t+="."+s.split(" ").join("."))}return t}return this._debugScope||(this._hostNode?this._debugScope=e(this._hostNode.parentElement)+" > "+e(this._hostNode):this._debugScope="page"),this._debugScope},n.prototype.toString=function(){var e="Busy Context: [scope=";return e+=this._getDebugScope(),e+=" states="+this._getCompoundDescription()+"]"},n._deliverThrottledUpdates=function(){e.ComponentBinding&&e.ComponentBinding.deliverChanges()},n._DESCRIPTION="description",n._OJ_RIP="__ojRip",n._BOOTSTRAP_MEDIATOR=new function(){var e,t,s;"undefined"!=typeof window&&(e=window.oj_whenReady),this.whenReady=function(){return t||(t=e?new Promise(function(e){s=e}):Promise.resolve(!0))},this.isReady=function(){return!e},this.notifyComplete=function(){s?r().then(function(){e=!1,"function"==typeof s&&s(!0),s=null}):e=!1}};const u=Symbol(),c=function(e){this.Init(e)};return e.Object.createSubclass(c,e.Object,"oj.Context"),c.prototype.Init=function(e){c.superclass.Init.call(this),this._node=e},c.prototype.getParentContext=function(){return this._node?c.getContext(c.getParentElement(this._node)):null},c.getContext=function(e){let t=e;for(;t;){let e=t[u];if(e)return e;if(t.hasAttribute(c._OJ_CONTEXT_ATTRIBUTE))return c._createContext(t);const s=c.getParentElement(t);if(c._hasImplicitSlotContext(s,t))return c._createContext(t);t=s}return c.getPageContext()},c.getPageContext=function(){return c._pageContext||(c._pageContext=new c),c._pageContext},c.prototype.getBusyContext=function(){return this._busyContext||(this._busyContext=new n(this._node,this)),this._busyContext},c.setBusyContextDefaultTimeout=function(e){n.setDefaultTimeout(e)},c._OJ_CONTEXT_ATTRIBUTE="data-oj-context",c._OJ_SURROGATE_ATTR="data-oj-surrogate-id",c.getParentElement=function(e){if(e&&e.hasAttribute(c._OJ_SURROGATE_ATTR)){var t=document.getElementById(e.getAttribute(c._OJ_SURROGATE_ATTR));if(t)return t.parentElement}return e._ojReportBusy||e.parentElement},c._hasImplicitSlotContext=function(e,t){if(t&&t.nodeType===Node.ELEMENT_NODE){const o=e&&!e.classList.contains("oj-complete")?s.getMetadata(e.localName):null;if(o){const e=t.getAttribute("slot")||"",s=o.slots,n=s?s[e]:null;return n&&n.implicitBusyContext}}return!1},c._createContext=function(e){const t=new c(e);return e[u]=t,t},c.__addPreactPromise=function(e,t){n.__preactPromisesMap.set(e,t)},c.__removePreactPromise=function(e){n.__preactPromisesMap.delete(e)},c});
//# sourceMappingURL=ojcontext.js.map;
/**
 * @license
 * Copyright (c) 2014, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
define('ojs/ojthemeutils',["exports","ojs/ojcore-base","ojs/ojlogger"],function(e,t,a){"use strict";t=t&&Object.prototype.hasOwnProperty.call(t,"default")?t.default:t;const r="oj-theme-json",o={getThemeName:function(){return(o.parseJSONFromFontFamily(r)||{}).name},getThemeTargetPlatform:function(){return(o.parseJSONFromFontFamily(r)||{}).targetPlatform},clearCache:function(){o._cache=null,o._cssVarCache=null},parseJSONFromFontFamily:function(e){null==o._cache&&(o._cache={},o._null_cache_value={},o._headfontstring=window.getComputedStyle(document.head).getPropertyValue("font-family"));var t=o._cache[e];if(t===o._null_cache_value)return null;if(null!=t)return t;if("undefined"==typeof document)return null;var r=document.createElement("meta");r.className=e,document.head.appendChild(r);var n=window.getComputedStyle(r).getPropertyValue("font-family");if(null!=n)if(n===o._headfontstring)a.warn("parseJSONFromFontFamily: When the selector ",e," is applied the font-family read off the dom element is ",n,". The parent dom elment has the same font-family value."," This is interpreted to mean that no value was sent down for selector ",e,". Null will be returned.");else{var l=n.replace(/^['"]+|\s+|\\|(;\s?})+|['"]$/g,"");if(l)try{t=JSON.parse(l)}catch(o){var s=l.indexOf(","),c=!1;if(s>-1){l=l.substring(s+2);try{t=JSON.parse(l),c=!0}catch(e){}}if(!1===c)throw a.error("Error parsing json for selector "+e+".\nString being parsed is "+l+". Error is:\n",o),document.head.removeChild(r),o}}return document.head.removeChild(r),o._cache[e]=null==t?o._null_cache_value:t,t}};var n=e=>(o._cssVarCache||(o._cssVarCache=new Map),o._cssVarCache.has(e)||o._cssVarCache.set(e,(e=>(o._rootCSSStyles||(o._rootCSSStyles=window.getComputedStyle(document.documentElement)),o._rootCSSStyles.getPropertyValue(e).replace(/^['"\s]+|\s+|\\|(;\s?})+|['"\s]$/g,"")))(e)),o._cssVarCache.get(e));o.getCachedCSSVarValues=e=>e.map(e=>n(e)),o.verifyThemeVersion=()=>{};const l=o.clearCache,s=o.getThemeName,c=o.getThemeTargetPlatform,m=o.parseJSONFromFontFamily,i=o.verifyThemeVersion,h=o.getCachedCSSVarValues;e.clearCache=l,e.getCachedCSSVarValues=h,e.getThemeName=s,e.getThemeTargetPlatform=c,e.parseJSONFromFontFamily=m,e.verifyThemeVersion=i,Object.defineProperty(e,"__esModule",{value:!0})});
//# sourceMappingURL=ojthemeutils.js.map;
/**
 * @license
 * Copyright (c) 2014, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
define('ojs/ojcustomelement-utils',["exports","ojs/ojcore-base","ojs/ojcustomelement-registry","ojs/ojcontext","ojs/ojlogger","ojs/ojthemeutils"],function(e,t,r,i,n,s){"use strict";t=t&&Object.prototype.hasOwnProperty.call(t,"default")?t.default:t,i=i&&Object.prototype.hasOwnProperty.call(i,"default")?i.default:i;const o={};class a{static isValidCustomElementName(e){const t=a._RESERVED_TAGS.has(e),r=a._ELEMENT_NAME_REGEXP.test(e);return!t&&r&&!e.startsWith("oj-bind-",0)}static getSupportedTypes(e){if(!e)return{};let t=o[e];if(!t){t={};const r=e.toLowerCase(),i=r.match(/(?=[^|])(?:[^|]*<[^>]+>)*[^|]*/g);let n=0;i.forEach(e=>{const r=e.trim();"any"===r||"boolean"===r||"number"===r||"string"===r||"array"===r||"object"===r||"null"===r?t[r]=1:0===r.indexOf("array<")?t.array=1:0===r.indexOf("object<")?t.object=1:t.other=1,n++}),t.typeCount=n,o[r]=t}return t}static getUniqueId(e){if(e)return e;const t=a._UNIQUE+a._UNIQUE_INCR;return a._UNIQUE_INCR+=1,t}static comparePropertyValues(e,r,i){return e?t.Object.compareValues(r,i):r===i}}a._UNIQUE_INCR=0,a._UNIQUE="_oj",a._RESERVED_TAGS=new Set(["annotation-xml","color-profile","font-face","font-face-src","font-face-uri","font-face-format","font-face-name","missing-glyph"]),a._ELEMENT_NAME_REGEXP=/^[a-z][.0-9_a-z]*-[-.0-9_a-z]*$/;const l={accessKey:"accesskey",autocapitalize:"autocapitalize",autofocus:"autofocus",class:"class",contentEditable:"contenteditable",dir:"dir",draggable:"draggable",enterKeyHint:"enterkeyhint",hidden:"hidden",id:"id",inputMode:"inputmode",lang:"lang",role:"role",slot:"slot",spellcheck:"spellcheck",style:"style",tabIndex:"tabindex",translate:"translate",title:"title"};class c extends Error{constructor(e,t){super(`${e.localName} with id '${e.id||""}': ${t}`),Error.captureStackTrace&&Error.captureStackTrace(this,c),this.name="JetElementError"}}const d=/^\s*\[[^]*\]\s*$/,u=/^\s*\{[^]*\}\s*$/,p=/^(?:\{\{)([^]+)(?:\}\})$/,h=/^(?:\[\[)([^]+)(?:\]\])$/,g={};Object.keys(l).forEach(function(e){const t=l[e];e!==t&&(g[t]=e)});class m{static getExpressionInfo(e){let t,r=!1;if(e){const i=e.trim();let n=p.exec(i);t=n?.[1],t||(r=!0,n=h.exec(i),t=n?.[1])}return{downstreamOnly:r,expr:t}}static attributeToPropertyValue(e,t,r,i){if(null!=r)try{return m.coerceValue(e,t,r,i.type)}catch(r){throw new c(e,`Error while parsing parsing attribute ${t}. ${r.stack||r}`)}}static parseAttributeValue(e,t,r,i,n=null){if(!i)throw new Error(`Unable to parse ${t}='${r}' for ${e} with id '${n}'.         This attribute only supports data bound values. Check the API doc for supported types`);const s=a.getSupportedTypes(i),o=d.test(r),l=u.test(r);if(s.array&&o||s.object&&l||s.any&&(o||l))try{return JSON.parse(r)}catch(i){throw new Error(`Unable to parse ${t}='${r}' for ${e} with id '${n}'           to a JSON Object. Check the value for correct JSON syntax, e.g. double quoted strings. ${i}`)}else{if(s.string||s.any)return r;if(s.boolean)return m.parseBooleanValue(e,t,r,i,n);if(s.number&&!isNaN(r))return Number(r)}throw new Error(`Unable to parse ${t}='${r}' for ${e} with id '${n}'       to a ${i}.`)}static parseBooleanValue(e,t,r,i,n){if(null==r||"true"===r||""===r||r.toLowerCase()===t)return!0;if("false"===r)return!1;throw new Error(`Unable to parse ${t}='${r}' for ${e} with id '${n}' to a ${i}.`)}static coerceValue(e,t,r,i){const n=e.tagName.toLowerCase();return m.parseAttributeValue(n,t,r,i,e.id)}static coerceBooleanValue(e,t,r,i){return m.parseBooleanValue(e.tagName.toLowerCase(),t,r,i,e.id)}static isGlobalOrData(e){return Object.prototype.hasOwnProperty.call(l,e)||e.startsWith("data-")||e.startsWith("aria-")}static getGlobalAttrForProp(e){return l[e]||e}static getGlobalPropForAttr(e){return g[e]||e}static getGlobalValuePropForAttr(e){return"contenteditable"===e.toLowerCase()?"isContentEditable":m.getGlobalPropForAttr(e)}}function _(e,t){let r=e.cache;return r||(r=new Map,e.cache=r),r.has(t)||r.set(t,e(t)),r.get(t)}m.attributeToPropertyName=_.bind(null,e=>e.toLowerCase().replace(/-(.)/g,(e,t)=>t.toUpperCase())),m.propertyNameToAttribute=_.bind(null,e=>e.replace(/([A-Z])/g,e=>`-${e.toLowerCase()}`)),m.eventTypeToEventListenerProperty=_.bind(null,e=>"on"+e.substr(0,1).toUpperCase()+e.substr(1)),m.isEventListenerProperty=_.bind(null,e=>/^on[A-Z]/.test(e)),m.isEventListenerAttr=_.bind(null,e=>/^on-[a-z]/.test(e)),m.eventListenerPropertyToEventType=_.bind(null,e=>e.substr(2,1).toLowerCase()+e.substr(3)),m.propertyNameToChangeEventType=_.bind(null,e=>`${e}Changed`),m.propertyNameToChangedCallback=_.bind(null,e=>`on${e[0].toUpperCase()}${e.substr(1)}Changed`),m.eventTriggerToEventType=_.bind(null,e=>`oj${e.substr(0,1).toUpperCase()}${e.substr(1)}`),m.eventAttrToPreactPropertyName=_.bind(null,e=>e.toLowerCase().split("-").reduce((e,t,r)=>{return r>1?e+((i=t).charAt(0).toUpperCase()+i.substr(1)):e+t;var i},""));class b{static createBindForEachHandlerStr(e){const t=e.getAttribute("data");let r=m.getExpressionInfo(t).expr;if(!r)try{const e=JSON.parse(t);if(!Array.isArray(e))throw new Error(`Literal value must be an array, actual value: ${t}`);r=t}catch(e){throw new Error(`The value on the oj-bind-for-each data attribute should be either a JSON array or an expression : ${e}`)}if(!r)return;const i=b.getExpressionForAttr(e,"as",!0);return`ko _ojBindForEach_:{data:${r}${i?`,as:${i}}`:"}"}`}static getNodeReplacementCommentStr(e){for(var t=e.tagName.toLowerCase(),r=e.attributes,i=0;i<r.length;i++){var n=r[i];t+=" ",t+=n.name,t+="='",t+=n.value,t+="'"}return t}static getExpressionForAttr(e,t,r){const i=e.getAttribute(t);if(null!=i){let e=m.getExpressionInfo(i).expr;return null==e&&(e=r?`'${i}'`:i),e}return null}}const C=Symbol("childBindingProvider"),E=Symbol("cachedBindingProvider"),y=new Set,f="oj-subtree-hidden",v="oj-pending-subtree-hidden",P=Symbol("ojSlotWhitespace");class S{static subtreeShown(e,t,r){S._legacySubtreeShownOnceCB?.(e,t),e.classList.remove(f);const i=S._legacySubtreeShownInstanceCB,n=i?T(e=>i(e,t)):null;k(e,n,r?null:B)}static getElementInfo(e){return e?`${e.tagName.toLowerCase()} with id '${e.id}'`:""}static getElementState(e){let t=e[S._ELEMENT_STATE_KEY];if(!t&&r.isElementRegistered(e.tagName)){t=new(0,r.getElementRegistration(e.tagName).stateClass)(e),Object.defineProperty(e,S._ELEMENT_STATE_KEY,{value:t})}return t??null}static getElementBridge(e){let t=e[S._ELEMENT_BRIDGE_KEY];if(void 0===t&&r.isElementRegistered(e.tagName)){t=null;const i=r.getElementRegistration(e.tagName).bridgeProto;if(void 0!==i){t=Object.create(i);const n=r.getElementDescriptor(e.tagName);t.initializeBridge(e,n)}Object.defineProperty(e,S._ELEMENT_BRIDGE_KEY,{value:t})}return t??null}static getSlotMap(e){const t={},i=e.childNodes,n=i.length>0?r.getMetadata(e.localName):null;for(let r=0;r<i.length;r++){const s=i[r];if(S.isSlotable(s)){const r=S.getSlotAssignment(s);t[r]||(t[r]=[]),S._possiblyApplyImplicitContext(s,r,n),t[r].push(s),s[E]=S._getBindingProviderTypeForSlot(e,s)}}return t}static getSlotAssignment(e){const t=null!=e.__oj_slots?e.__oj_slots:e.getAttribute&&e.getAttribute("slot");return t||""}static isSlotable(e){const t=1===e.nodeType||3===e.nodeType&&!!e.nodeValue.trim();return t||(e[P]=!0),t}static getElementProperty(e,t){if(r.isElementRegistered(e.tagName)){let r=e[S.VCOMP_INSTANCE];return r?S.getPropertyValue(r.props,t):e.getProperty(t)}return e[t]}static getPropertyValue(e,t){let r=e;const i=t.split(".");try{i.forEach(e=>r=r[e])}catch{return}return r}static allowSlotRelocation(e){S._ALLOW_RELOCATION_COUNT+=e?1:-1}static canRelocateNode(e,t){const r=S.getElementState(e);if(!r.getSlotMap()||S._ALLOW_RELOCATION_COUNT>0)return!0;const i=r.getSlotSet();if(r.isPostCreateCallbackOrComplete()&&(i.has(t)||t[P])){if(e.hasAttribute("data-oj-preact"))throw new c(e,`${t.localName} cannot be relocated as a child of this element.`);if("preact"===r.getBindingProviderType())return!1}return!0}static cleanComponentBindings(e){S.getElementState(e)?.getBindingProviderCleanNode()(e)}static getClassSet(e){if(e){const t=e.split(/\s+/).filter(e=>e.length>0);if(t.length>0)return new Set(t)}return y}static _possiblyApplyImplicitContext(e,t,r){e?.nodeType===Node.ELEMENT_NODE&&r.slots?.[t]?.implicitBusyContext&&e.setAttribute("data-oj-context","")}static _getBindingProviderTypeForSlot(e,t){return t[E]||1===t.nodeType&&t.getAttribute("data-oj-binding-provider")||S.getElementState(e)?.getBindingProviderType()}static markPendingSubtreeHidden(e){e.classList.add(v)}static unmarkPendingSubtreeHidden(e){e.classList.remove(v)}static registerLegacySubtreeCallbacks(e,t,r){S._legacySubtreeShownInstanceCB=e,S._legacySubtreeShownOnceCB=t,S._legacySubtreeHiddenInstanceCB=r}static parseAttrValue(e,t,i,n,s){if(null==n)return n;function o(r){return m.attributeToPropertyValue(e,t,r,s)}var a=r.getElementDescriptor(e.tagName).parseFunction;return a?a(n,i,s,function(e){return o(e)}):o(n)}}S._ELEMENT_STATE_KEY="_ojElementState",S._ELEMENT_BRIDGE_KEY="_ojBridge",S._ALLOW_RELOCATION_COUNT=0,S.VCOMP_INSTANCE=Symbol("vcompInstance"),S.subtreeHidden=function(e){const t=S._legacySubtreeHiddenInstanceCB;k(e,t?T(t):null,null),e.classList.add(f)};const N="oj-defer";function B(e){if(e.localName===N){if(!e._activate)throw new Error("subtreeShown called before module ojs/ojdefer was loaded");e._activate()}}function T(e){return t=>{S.allowSlotRelocation(!0);try{e(t)}finally{S.allowSlotRelocation(!1)}}}function k(e,t,r){if((t||r)&&!function(e){let t=e;for(;t;){if(t.nodeType===Node.DOCUMENT_NODE)return!1;if(t.nodeType===Node.ELEMENT_NODE&&t.classList.contains(f))return!0;t=t.parentNode}return!0}(e)){n(e);const t=[".oj-component-initnode"];r&&t.push(N);const s=[];t.forEach(function(e){s.push(`.${f} ${e}`),s.push(`.${v} ${e}`)}),r&&s.push(`${N}.${f}`);const o=t.join(","),a=s.join(",");var i=function(e,t){const r=[];let i=0;for(var n=0;n<t.length;n++){for(var s=t[n];i<e.length&&e[i]!==s;)r.push(e[i]),i+=1;i+=1}for(;i<e.length;)r.push(e[i]),i+=1;return r}(e.querySelectorAll(o),e.querySelectorAll(a));i.forEach(e=>n(e))}function n(e){t?.(e),r?.(e)}}class w{constructor(e){this.dirtyProps=new Set,this._componentState=A.WaitingToCreate,this._outerClasses=new Set,this.Element=e}startCreationCycle(){this._isInErrorState()||(null!=this._preCreatedPromise&&this._componentState!==A.WaitingToCreate||this._updateComponentState(A.Creating),this._registerBusyState())}pauseCreationCycle(){this._resolveBusyState()}resetCreationCycle(){this._updateComponentState(A.WaitingToCreate),this._bindingProviderPromise=null,this._preCreatedPromise=null,this._createdPromise=null}isComplete(){return this._componentState===A.Complete}isCreating(){return this._componentState===A.Creating}isPostCreateCallbackOrComplete(){return this._componentState===A.PostCreateCallback||this.isComplete()}canHandleAttributes(){return!this._isInErrorState()&&this._componentState!==A.WaitingToCreate}beginApplyingBindings(){this.isComplete()||(this._bindingProviderType="knockout",this._updateComponentState(A.ApplyingBindings))}allowPropertySets(){return this._componentState===A.Creating||this._componentState===A.ApplyingBindings||this._componentState===A.BindingsApplied||this._componentState===A.PostCreateCallback||this._componentState===A.Complete}allowPropertyChangedEvents(){return this._componentState===A.BindingsApplied||this._componentState===A.PostCreateCallback||this._componentState===A.Complete}getTrackChildrenOption(){const e=r.getElementDescriptor(this.Element.tagName).metadata;return e?.extension?._TRACK_CHILDREN??"none"}setCreateCallback(e){this._isInErrorState()||(this._updateComponentState(A.WaitingForBindings),this._preCreatedPromise||(this._preCreatedPromise=this.GetPreCreatedPromise()),this._createdPromise=this._preCreatedPromise.then(()=>{if(!this._isInErrorState()){const t=e();return this._updateComponentState(A.PostCreateCallback),t}return Promise.reject()}),this._createdPromise.then(()=>{this._updateComponentState(A.Complete)},e=>{if(e===w._DISCONNECTED)this.resetCreationCycle();else if(this._updateComponentState(A.Incomplete),e)throw e}))}setBindingsDisposedCallback(e){this._disposedCallback=e}resolveBindingProvider(e){this._bpClean=e.__CleanNode,this._resolveBindingProviderCallback&&(this._bindingsApplied(),this._resolveBindingProviderCallback(e),this._resolveBindingProviderCallback=null,this._rejectBindingProviderCallback=null),this._bindingProvider=e}rejectBindingProvider(e){this._rejectBindingProviderCallback&&(this._rejectBindingProviderCallback(e),this._resolveBindingProviderCallback=null,this._rejectBindingProviderCallback=null)}disposeBindingProvider(){this.isComplete()?this._disposedCallback?.():(this.rejectBindingProvider(),this._updateComponentState(A.BindingsDisposed))}setBindingProviderCallback(e){this._bindingProviderCallback=e}getBindingProviderPromise(){const e=this.getBindingProviderType();if(!this._bindingProviderPromise)if(s.verifyThemeVersion(),"none"===e||"preact"===e)this._bindingsApplied(),this._bindingProviderPromise=Promise.resolve(null);else{if("knockout"!==e)throw new c(this.Element,`Unknown binding provider '${e}'.`);this._bindingProvider?(this._bindingsApplied(),this._bindingProviderPromise=Promise.resolve(this._bindingProvider)):this._bindingProviderPromise=new Promise((e,t)=>{this._resolveBindingProviderCallback=e,this._rejectBindingProviderCallback=t})}return this._bindingProviderPromise}getBindingProvider(){return this._bindingProvider}getBindingProviderType(){return this._bindingProviderType||(this._bindingProviderType=w._walkBindingProviders(this.Element)),this._bindingProviderType}getUseKoFlag(){return void 0===this._useKoFlag&&(this._useKoFlag=w._findKoUseFlag(this.Element)),this._useKoFlag}getBindingProviderCleanNode(){return this._bpClean||w._NOOP}getDescriptiveText(){let e=this.GetDescriptiveValue("aria-label")||this.GetDescriptiveValue("title")||this.GetDescriptiveLabelByValue("labelled-by")||this.GetDescriptiveValue("label-hint")||this.GetDescriptiveLabelByValue("aria-labelledby");return e=e?e.trim().replace(/\s+/g," "):"",e}getSlotMap(e){return!this._slotMap&&e&&(this._slotMap=S.getSlotMap(this.Element)),this._slotMap}getSlotSet(){if(!this._slotSet){const e=Object.keys(this._slotMap);let t=[];e.forEach(e=>t=t.concat(this._slotMap[e])),this._slotSet=new Set(t)}return this._slotSet}setOuterClasses(e){this.PatchClasses(this._outerClasses,e),this._outerClasses=e}PatchClasses(e,t){e.forEach(e=>{t.has(e)||this.Element.classList.remove(e)}),t.forEach(t=>{e.has(t)||this.Element.classList.add(t)})}GetCreatedPromise(){return this._createdPromise}GetPreCreatedPromise(){let e=this.getBindingProviderPromise();return"none"!==this.getTrackChildrenOption()&&(e=e.then(e=>this._getTrackedChildrenPromises(e))),e}IsTransferAttribute(e){return!1}GetDescriptiveValue(e){const t=m.attributeToPropertyName(e),i=r.getElementProperties(this.Element);let n;return n=i&&i[t]?this.Element[t]:this.IsTransferAttribute(e)?this.GetDescriptiveTransferAttributeValue(e):this.Element.getAttribute(e),n}GetDescriptiveTransferAttributeValue(e){return""}GetDescriptiveLabelByValue(e){const t=this.GetDescriptiveValue(e);if(t){const e=document.getElementById(t);if(e)return e.textContent}return null}_updateComponentState(e){if(this._componentState!==A.BindingsDisposed){switch(e){case A.WaitingToCreate:this.Element.classList.remove("oj-complete"),this._createdPromise=null;break;case A.Complete:this.Element.classList.add("oj-complete"),this._resolveBusyState();break;case A.BindingsDisposed:case A.Incomplete:this.Element.classList.add("oj-incomplete"),this._resolveBusyState()}this._componentState=e}}_bindingsApplied(){this._updateComponentState(A.BindingsApplied),this._bindingProviderCallback?.()}_registerBusyState(){const e=i.getContext(this.Element).getBusyContext();if(this._resolveCreatedBusyState)throw new c(this.Element,"Registering busy state before previous state is resolved.");this._resolveCreatedBusyState=e.addBusyState({description:S.getElementInfo(this.Element)+" is being upgraded."})}_resolveBusyState(){this._resolveCreatedBusyState&&(this._resolveCreatedBusyState(),this._resolveCreatedBusyState=null)}static _findKoUseFlag(e){return!!e.querySelector(":scope > template[data-oj-use-ko]")}static _walkBindingProviders(e,t=e){let r=e[E];if(r)return r;if(r=e.getAttribute("data-oj-binding-provider"),!r){const i=e.parentElement;if(null==i){if(e!==document.documentElement)throw new c(t,"Cannot determine binding provider for a disconnected subtree.");r="knockout"}else r=i[C]??w._walkBindingProviders(i,t)}return e[E]=r,r}_getTrackedChildrenPromises(e){const t=this.getTrackChildrenOption(),s=i.getContext(this.Element).getBusyContext(),o=this._getChildrenToTrack(this.Element,t,[]).map(t=>{if(!e){const e=s.addBusyState({description:`Waiting for element ${t.localName} to be defined.`}),i=setInterval(()=>{n.warn(`Waiting for element ${t.localName} to be defined.`)},2e4);return customElements.whenDefined(t.localName).then(()=>(e(),clearInterval(i),r.isElementRegistered(t.tagName)?S.getElementState(t).GetCreatedPromise():null)).catch(r=>{throw e(),clearInterval(i),new Error(`Error defining element ${t.localName} : ${r}`)})}return r.isElementRegistered(t.tagName)?S.getElementState(t).GetCreatedPromise():null});return Promise.all(o)}_getChildrenToTrack(e,t,r){const i=e.childNodes;for(let e=0;e<i.length;e++){const n=i[e];a.isValidCustomElementName(n.localName)?r.push(n):"nearestCustomElement"===t&&this._getChildrenToTrack(n,t,r)}return r}_isInErrorState(){return this._componentState===A.Incomplete||this._componentState===A.BindingsDisposed}}var A;w._DISCONNECTED=Symbol("disconnected"),w._NOOP=()=>{},function(e){e[e.WaitingToCreate=0]="WaitingToCreate",e[e.Creating=1]="Creating",e[e.WaitingForBindings=2]="WaitingForBindings",e[e.ApplyingBindings=3]="ApplyingBindings",e[e.BindingsApplied=4]="BindingsApplied",e[e.PostCreateCallback=5]="PostCreateCallback",e[e.Complete=6]="Complete",e[e.Incomplete=7]="Incomplete",e[e.BindingsDisposed=8]="BindingsDisposed"}(A||(A={}));const j=Symbol("custom element null"),O=Symbol("custom element empty string"),I=Symbol("custom element undefined"),L="__oj_private_do_not_use_value",$="__oj_private_do_not_use_checked",D=new Map([["value",L],["checked",$]]),V=e=>e===j?null:e===O?"":e!==I&&""!==e?e:void 0,R=Symbol("ojBindConvertedNode");e.AttributeUtils=m,e.CACHED_BINDING_PROVIDER=E,e.CHILD_BINDING_PROVIDER=C,e.CustomElementUtils=S,e.ElementState=w,e.ElementUtils=a,e.JetElementError=c,e.KoBindingUtils=b,e.LifecycleElementState=class extends w{constructor(){super(...arguments),this._connectCallbacks=[],this._disconnectCallbacks=[]}addLifecycleCallbacks(e,t){e&&this._connectCallbacks.push(e),t&&this._disconnectCallbacks.push(t)}removeLifecycleCallbacks(e,t){e&&(this._connectCallbacks=this._connectCallbacks.filter(t=>t!=e)),t&&(this._disconnectCallbacks=this._disconnectCallbacks.filter(e=>e!=t))}executeLifecycleCallbacks(e){(e?this._connectCallbacks:this._disconnectCallbacks).forEach(e=>e())}},e.OJ_BIND_CONVERTED_NODE=R,e.addPrivatePropGetterSetters=(e,t)=>{"value"!==t&&"checked"!==t||Object.defineProperty(e,D.get(t),{get(){return this[t]},set(e){this[t]=V(e)}})},e.convertPrivatePropFromPreact=(e,t)=>e===L?{prop:"value",value:V(t)}:e===$?{prop:"checked",value:V(t)}:{prop:e,value:t},e.publicToPrivateName=D,e.toSymbolizedValue=e=>null===e?j:""===e?O:void 0===e?I:e,e.transformPreactValue=(e,t,r,i)=>{let n=i;return"value"!==t&&"checked"!==t&&""===n&&(n=((e,t,r)=>{if((!e||"preact"===S.getElementState(e).getBindingProviderType())&&(!a.getSupportedTypes(t.type).string||t.enumValues))return;return r})(e,r,n)),n},Object.defineProperty(e,"__esModule",{value:!0})});
//# sourceMappingURL=ojcustomelement-utils.js.map;
define('@oracle/oraclejet-preact/index-f7ad24df',['exports'], (function(E){"use strict";const e={name:"redwood",base:{cursor:{clickable:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-cursor-clickable)"},boxShadow:{xs:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-box-shadow-xs)",sm:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-box-shadow-sm)",md:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-box-shadow-md)",lg:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-box-shadow-lg)",xl:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-box-shadow-xl)"},borderRadius:{sm:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-border-radius-sm)",md:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-border-radius-md)",lg:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-border-radius-lg)",xl:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-border-radius-xl)"}},colorScheme:{palette:{neutral:{0:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-neutral-0)",10:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-neutral-10)",20:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-neutral-20)",30:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-neutral-30)",40:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-neutral-40)",50:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-neutral-50)",60:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-neutral-60)",70:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-neutral-70)",80:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-neutral-80)",90:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-neutral-90)",100:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-neutral-100)",110:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-neutral-110)",120:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-neutral-120)",130:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-neutral-130)",140:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-neutral-140)",150:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-neutral-150)",160:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-neutral-160)",170:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-neutral-170)",180:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-neutral-180)",190:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-neutral-190)",200:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-neutral-200)"},danger:{10:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-danger-10)",20:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-danger-20)",30:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-danger-30)",40:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-danger-40)",50:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-danger-50)",60:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-danger-60)",70:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-danger-70)",80:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-danger-80)",90:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-danger-90)",100:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-danger-100)",110:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-danger-110)",120:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-danger-120)",130:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-danger-130)",140:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-danger-140)",150:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-danger-150)",160:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-danger-160)",170:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-danger-170)",180:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-danger-180)",190:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-danger-190)"},success:{10:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-success-10)",20:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-success-20)",30:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-success-30)",40:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-success-40)",50:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-success-50)",60:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-success-60)",70:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-success-70)",80:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-success-80)",90:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-success-90)",100:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-success-100)",110:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-success-110)",120:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-success-120)",130:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-success-130)",140:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-success-140)",150:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-success-150)",160:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-success-160)",170:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-success-170)",180:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-success-180)",190:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-success-190)"},warning:{10:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-warning-10)",20:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-warning-20)",30:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-warning-30)",40:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-warning-40)",50:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-warning-50)",60:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-warning-60)",70:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-warning-70)",80:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-warning-80)",90:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-warning-90)",100:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-warning-100)",110:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-warning-110)",120:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-warning-120)",130:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-warning-130)",140:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-warning-140)",150:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-warning-150)",160:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-warning-160)",170:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-warning-170)",180:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-warning-180)",190:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-warning-190)"},info:{10:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-info-10)",20:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-info-20)",30:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-info-30)",40:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-info-40)",50:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-info-50)",60:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-info-60)",70:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-info-70)",80:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-info-80)",90:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-info-90)",100:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-info-100)",110:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-info-110)",120:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-info-120)",130:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-info-130)",140:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-info-140)",150:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-info-150)",160:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-info-160)",170:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-info-170)",180:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-info-180)",190:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-info-190)"},brand:{10:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-brand-10)",20:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-brand-20)",30:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-brand-30)",40:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-brand-40)",50:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-brand-50)",60:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-brand-60)",70:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-brand-70)",80:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-brand-80)",90:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-brand-90)",100:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-brand-100)",110:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-brand-110)",120:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-brand-120)",130:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-brand-130)",140:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-brand-140)",150:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-brand-150)",160:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-brand-160)",170:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-brand-170)",180:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-brand-180)",190:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-palette-brand-190)"}},overlay:{hover:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-overlay-hover)",active:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-overlay-active)",dangerHover:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-overlay-danger-hover)",dangerActive:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-overlay-danger-active)",scrim:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-overlay-scrim)",inverseHover:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-overlay-inverse-hover)",inverseActive:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-overlay-inverse-active)",dropActive:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-overlay-drop-active)"},pageBackground:{neutral0:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-page-background-neutral0)",neutral10:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-page-background-neutral10)",neutral20:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-page-background-neutral20)",neutral30:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-page-background-neutral30)",neutral40:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-page-background-neutral40)"},surface:{neutral0:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-surface-neutral0)",neutral10:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-surface-neutral10)",neutral20:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-surface-neutral20)",neutral30:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-surface-neutral30)",selected:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-surface-selected)",disabled:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-surface-disabled)",popup:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-surface-popup)",neutral:{low:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-surface-neutral-low)",subtle:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-surface-neutral-subtle)",strong:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-surface-neutral-strong)"},success:{low:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-surface-success-low)",subtle:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-surface-success-subtle)",strong:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-surface-success-strong)"},info:{low:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-surface-info-low)",subtle:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-surface-info-subtle)",strong:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-surface-info-strong)"},warning:{low:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-surface-warning-low)",subtle:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-surface-warning-subtle)",strong:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-surface-warning-strong)"},danger:{low:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-surface-danger-low)",subtle:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-surface-danger-subtle)",strong:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-surface-danger-strong)"}},border:{enabled:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-border-enabled)",disabled:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-border-disabled)",divider:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-border-divider)",dividerOpaqueColor:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-border-divider-opaque-color)",dividerOpaquePercent:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-border-divider-opaque-percent)",selected:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-border-selected)",dropLine:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-border-drop-line)",selectedNeutral:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-border-selected-neutral)",warning:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-border-warning)",danger:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-border-danger)",keyboardFocus:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-border-keyboard-focus)"},boxshadow:{shadowcolor:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-boxshadow-shadowcolor)"},textIcon:{primary:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-text-icon-primary)",secondary:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-text-icon-secondary)",disabled:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-text-icon-disabled)",inverse:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-text-icon-inverse)",onColor:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-text-icon-on-color)",link:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-text-icon-link)",success:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-text-icon-success)",info:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-text-icon-info)",warning:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-text-icon-warning)",danger:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-text-icon-danger)"},textfield:{surface:{enabled:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-textfield-surface-enabled)"},border:{enabled:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-textfield-border-enabled)"}},collection:{header:{text:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-collection-header-text)",surface:{selected:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-collection-header-surface-selected)",partialSelected:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-collection-header-surface-partial-selected)"}}},collectionGrid:{cell:{surfaceEdit:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-collection-grid-cell-surface-edit)"}},measure:{track:{enabled:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-measure-track-enabled)",disabled:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-measure-track-disabled)"},fill:{enabled:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-measure-fill-enabled)",disabled:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-measure-fill-disabled)"},thumb:{surface:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-measure-thumb-surface)"},reference:{line:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-measure-reference-line)",lineContrast:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-measure-reference-line-contrast)",area:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-measure-reference-area)"}},dvt:{contrastLine:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-dvt-contrast-line)",paletteQualitative:{1:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-dvt-palette-qualitative-1)",2:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-dvt-palette-qualitative-2)",3:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-dvt-palette-qualitative-3)",4:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-dvt-palette-qualitative-4)",5:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-dvt-palette-qualitative-5)",6:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-dvt-palette-qualitative-6)",7:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-dvt-palette-qualitative-7)",8:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-dvt-palette-qualitative-8)",9:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-dvt-palette-qualitative-9)",10:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-dvt-palette-qualitative-10)",11:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-dvt-palette-qualitative-11)",12:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-dvt-palette-qualitative-12)"},threshold:{success:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-dvt-threshold-success)",warning:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-dvt-threshold-warning)",danger:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-dvt-threshold-danger)"},marquee:{border:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-dvt-marquee-border)",surface:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-dvt-marquee-surface)"},referenceObject:{area:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-dvt-reference-object-area)",line:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-dvt-reference-object-line)"},overview:{background:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-dvt-overview-background)",windowBackground:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-dvt-overview-window-background)",windowBorder:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-dvt-overview-window-border)"}}},scale:{size:{units:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-size-units)"}},density:{density:{units:"var(--oj-c-EXPERIMENTAL-DO-NOT-USE-density-units)"}}};E.t=e}));
//# sourceMappingURL=index-f7ad24df.js.map
;
define('css',[],function(){if("undefined"==typeof window)return{load:function(a,b,c){c()}};var a=document.getElementsByTagName("head")[0],b=window.navigator.userAgent.match(/Trident\/([^ ;]*)|AppleWebKit\/([^ ;]*)|Opera\/([^ ;]*)|rv\:([^ ;]*)(.*?)Gecko\/([^ ;]*)|MSIE\s([^ ;]*)|AndroidWebKit\/([^ ;]*)/)||0,c=!1,d=!0;b[1]||b[7]?c=parseInt(b[1])<6||parseInt(b[7])<=9:b[2]||b[8]?d=!1:b[4]&&(c=parseInt(b[4])<18);var e={};e.pluginBuilder="./css-builder";var f,g,h,i=function(){f=document.createElement("style"),a.appendChild(f),g=f.styleSheet||f.sheet},j=0,k=[],l=function(a){g.addImport(a),f.onload=function(){m()},j++,31==j&&(i(),j=0)},m=function(){h();var a=k.shift();return a?(h=a[1],void l(a[0])):void(h=null)},n=function(a,b){if(g&&g.addImport||i(),g&&g.addImport)h?k.push([a,b]):(l(a),h=b);else{f.textContent='@import "'+a+'";';var c=setInterval(function(){try{f.sheet.cssRules,clearInterval(c),b()}catch(a){}},10)}},o=function(b,c){var e=document.createElement("link");if(e.type="text/css",e.rel="stylesheet",d)e.onload=function(){e.onload=function(){},setTimeout(c,7)};else var f=setInterval(function(){for(var a=0;a<document.styleSheets.length;a++){var b=document.styleSheets[a];if(b.href==e.href)return clearInterval(f),c()}},10);e.href=b,a.appendChild(e)};return e.normalize=function(a,b){return".css"==a.substr(a.length-4,4)&&(a=a.substr(0,a.length-4)),b(a)},e.load=function(a,b,d,e){(c?n:o)(b.toUrl(a+".css"),d)},e});

define('css!@oracle/oraclejet-preact/LayerHostStyles.styles',[],function(){});
define('@oracle/oraclejet-preact/UNSAFE_Layer/themes/LayerHostStyles.css',['exports', 'css!./../../LayerHostStyles.styles.css'], (function(e,s){"use strict";e.baseStyle="LayerHostStyles_baseStyle__f93kxw0",Object.defineProperty(e,"__esModule",{value:!0})}));
//# sourceMappingURL=LayerHostStyles.css.js.map
;
define('@oracle/oraclejet-preact/LayerHost-daf96749',['exports', 'preact', './index-f7ad24df', 'preact/jsx-runtime', 'preact/compat', './UNSAFE_Layer/themes/LayerHostStyles.css'], (function(e,t,o,r,n,a){"use strict";const c={user:{locale:document.documentElement.getAttribute("lang")||"en",direction:"rtl"===document.documentElement.getAttribute("dir")?.toLowerCase()?"rtl":"ltr",forcedColors:window.matchMedia?.("(forced-colors: active)")?.matches?"active":"none"},theme:o.t,colorScheme:"light",scale:"lg",currentBgColor:void 0,mode:"production",density:"standard"},s=t.createContext(c),d=t.createContext({}),i=n.forwardRef(((e,t)=>r.jsx("div",{id:"__root_layer_host",role:"presentation",ref:t,class:a.baseStyle})));i.displayName="Forwarded<LayerHost>",e.DefaultEnvironment=c,e.EnvironmentContext=s,e.LayerContext=d,e.LayerHost=i}));
//# sourceMappingURL=LayerHost-daf96749.js.map
;
define('@oracle/oraclejet-preact/LayerManager-8bad71b0',['exports', 'preact/jsx-runtime', 'preact/compat', './LayerHost-daf96749'], (function(e,t,r,a){"use strict";e.LayerManager=function({children:e}){const[s,n]=r.useState(),o=r.useCallback((e=>{null!==e&&n(e)}),[]);return t.jsx(a.LayerContext.Consumer,{children:r=>{let n={};s&&(n={getRootLayerHost:()=>s,getLayerHost:()=>s});const c=r.getLayerHost?r:n;return t.jsxs(a.LayerContext.Provider,{value:c,children:[e,!r.getLayerHost&&t.jsx(a.LayerHost,{ref:o})]})}})}}));
//# sourceMappingURL=LayerManager-8bad71b0.js.map
;
define('@oracle/oraclejet-preact/EnvironmentProvider-d538fcb2',['exports', 'preact/jsx-runtime', './LayerHost-daf96749', 'preact/hooks', './LayerManager-8bad71b0'], (function(e,n,r,t,o){"use strict";function s(e,n){const r=Object.assign({},e.user,n?.user),t=Object.assign({},e.theme,n?.theme),o=Object.assign({},e.translations),s=n?.translations||{};return Object.keys(s).forEach((e=>{let n=s[e];o[e]&&(n=Object.assign({},o[e],n)),o[e]=n})),{user:r,theme:t,translations:o,colorScheme:n?.colorScheme??e.colorScheme,scale:n?.scale??e.scale,currentBgColor:n?.currentBgColor??e.currentBgColor,mode:n?.mode??e.mode,density:n?.density??e.density}}e.EnvironmentProvider=function({children:e,environment:o}){const i=t.useContext(r.EnvironmentContext),c=t.useMemo((()=>s(i,o)),[i,o]);return n.jsx(r.EnvironmentContext.Provider,{value:c,children:e})},e.RootEnvironmentProvider=function({children:e,environment:i}){const c=t.useMemo((()=>s(r.DefaultEnvironment,i)),[i]);return n.jsx(r.EnvironmentContext.Provider,{value:c,children:n.jsx(o.LayerManager,{children:e})})}}));
//# sourceMappingURL=EnvironmentProvider-d538fcb2.js.map
;
define('@oracle/oraclejet-preact/UNSAFE_Environment',['exports', './LayerHost-daf96749', './EnvironmentProvider-d538fcb2', 'preact', './index-f7ad24df', 'preact/jsx-runtime', 'preact/compat', './UNSAFE_Layer/themes/LayerHostStyles.css', 'css!./LayerHostStyles.styles.css', 'preact/hooks', './LayerManager-8bad71b0'], (function(e,r,t,n,o,i,s,a,d,v,c){"use strict";e.EnvironmentContext=r.EnvironmentContext,e.EnvironmentProvider=t.EnvironmentProvider,e.RootEnvironmentProvider=t.RootEnvironmentProvider,Object.defineProperty(e,"__esModule",{value:!0})}));
//# sourceMappingURL=UNSAFE_Environment.js.map
;
/**
 * @license
 * Copyright (c) 2014, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
define('ojs/ojpreact-patch',["exports"],function(e){"use strict";Symbol();const t=Symbol(),n=Symbol();const o=Symbol();e.OJ_POPUP=t,e.OJ_SLOT_REMOVE=n,e.patchPopupParent=function(e){e[o]||(e[o]=!0,Object.defineProperty(e,"firstChild",{get(){let n=e.childNodes[0];return n?n[t]||n:null},enumerable:!0}))},e.patchSlotParent=function(e){if(!e[o]){e[o]=!0;const t=e.removeChild;e.removeChild=o=>{const l=o[n];return l?(l(),null):t.call(e,o)}}},Object.defineProperty(e,"__esModule",{value:!0})});
//# sourceMappingURL=ojpreact-patch.js.map;
/**
 * @license
 * Copyright (c) 2014, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
define('ojs/ojmetadatautils',["exports","ojs/ojcore-base","ojs/ojcustomelement-utils"],function(e,t,r){"use strict";t=t&&Object.prototype.hasOwnProperty.call(t,"default")?t.default:t;const o={};o.getDefaultValue=function(e,r){let n=e.value;if(void 0===n){const t=e.properties;if(t){const r={},l=Object.keys(t);for(let e=0;e<l.length;e++){const n=o.getDefaultValue(t[l[e]]);void 0!==n&&(r[l[e]]=n)}Object.keys(r).length>0&&(e.value=r,n=r)}}return void 0!==n&&(Array.isArray(n)?n=r?o.deepFreeze(n):n.slice():null!==n&&"object"==typeof n&&(n=r?o.deepFreeze(n):t.CollectionUtils.copyInto({},n,void 0,!0))),n},o.getDefaultValues=function(e,t){const r={},n=Object.keys(e);let l=!1;return n.forEach(function(n){const u=o.getDefaultValue(e[n],t);void 0!==u&&(r[n]=u,l=!0)}),l?r:null},o.deepFreeze=function(e){if(Object.isFrozen(e))return e;if(Array.isArray(e))e=e.map(e=>o.deepFreeze(e)),Object.freeze(e);else if(null!==e&&"object"==typeof e){const r=Object.getPrototypeOf(e);null!==r&&r!==Object.prototype||(t=e,Object.prototype.hasOwnProperty.call(t,"$$typeof"))||(Object.keys(e).forEach(function(t){e[t]=o.deepFreeze(e[t])}),Object.freeze(e))}var t;return e},o.getPropertyMetadata=function(e,t){const{subProp:r}=o.getComplexPropertyMetadata(e,t);return r},o.getComplexPropertyMetadata=function(e,t){let r=t,o=t;if(r){const t=e.split(".");for(let e=0;e<t.length&&(r=r[t[e]],0===e&&(o=r),r&&1!==t.length&&e!==t.length-1&&r.properties);e++)r=r.properties}return{prop:o,subProp:r}},o.checkEnumValues=function(e,t,r,o){if("string"==typeof r&&o){const e=o.enumValues;if(e&&-1===e.indexOf(r))throw new Error(`Invalid value '${r}' found for property '${t}'.Expected one of the following '${e.toString()}'.`)}},o.getFlattenedAttributes=function(e){const t=[];return o._getAttributesFromProperties("",e,t),t},o._getAttributesFromProperties=function(e,t,n){if(t){Object.keys(t).forEach(l=>{const u=t[l],a=e+l;n.push(r.AttributeUtils.propertyNameToAttribute(a)),u.properties&&o._getAttributesFromProperties(a+".",u.properties,n)})}};const n=o.getDefaultValue,l=o.getDefaultValues,u=o.deepFreeze,a=o.getPropertyMetadata,s=o.getComplexPropertyMetadata,p=o.checkEnumValues,i=o.getFlattenedAttributes;e.checkEnumValues=p,e.deepFreeze=u,e.getComplexPropertyMetadata=s,e.getDefaultValue=n,e.getDefaultValues=l,e.getFlattenedAttributes=i,e.getPropertyMetadata=a,Object.defineProperty(e,"__esModule",{value:!0})});
//# sourceMappingURL=ojmetadatautils.js.map;
define('@oracle/oraclejet-preact/classNames-08d99695',['exports'], (function(e){"use strict";e.classNames=function(e){return e.filter(Boolean).join(" ")}}));
//# sourceMappingURL=classNames-08d99695.js.map
;

define('css!@oracle/oraclejet-preact/LayerStyles.styles',[],function(){});
define('@oracle/oraclejet-preact/UNSAFE_Layer/themes/LayerStyles.css',['exports', 'css!./../../LayerStyles.styles.css'], (function(e,t){"use strict";e.baseStyle="LayerStyles_baseStyle__g9p4b90",e.styles={tooltipPriorityStyle:"LayerStyles_tooltipPriorityStyle__g9p4b91",popupPriorityStyle:"LayerStyles_popupPriorityStyle__g9p4b92",dialogPriorityStyle:"LayerStyles_dialogPriorityStyle__g9p4b93",messagesPriorityStyle:"LayerStyles_messagesPriorityStyle__g9p4b94"},Object.defineProperty(e,"__esModule",{value:!0})}));
//# sourceMappingURL=LayerStyles.css.js.map
;
define('@oracle/oraclejet-preact/useColorScheme-3022ec9a',['exports', 'preact/hooks', './LayerHost-daf96749', 'preact/jsx-runtime', 'preact/compat'], (function(e,t,o,n,r){"use strict";e.useColorScheme=function(){return t.useContext(o.EnvironmentContext).colorScheme}}));
//# sourceMappingURL=useColorScheme-3022ec9a.js.map
;
define('@oracle/oraclejet-preact/useScale-fa445112',['exports', 'preact/hooks', './LayerHost-daf96749', 'preact/jsx-runtime', 'preact/compat'], (function(e,t,n,o,r){"use strict";e.useScale=function(){return t.useContext(n.EnvironmentContext).scale}}));
//# sourceMappingURL=useScale-fa445112.js.map
;
define('@oracle/oraclejet-preact/Theme-d945adae',['exports'], (function(S){"use strict";const E=":root",_="oj-scale-dependent",C=`.${_}`,L="oj-scale-sm",T=`.${L}, ${E}.${L}`,e="oj-scale-md",A=`.${e}, ${E}.${e}`,o="oj-scale-lg",D=`.${o}`,N=E,c=`${C}, ${E}.${L}, ${E}.${e}`,$="oj-density-standard",s=`.${$}`,t="oj-density-compact",O=`.${t}`,R=`${O}, ${s}`,d="oj-density-dependent",n=`.${d}`;S.COLORSCHEME_DEPENDENT_CLASS="oj-c-colorscheme-dependent",S.DARK_CLASS="oj-c-colorscheme-dark",S.DENSITY_COMPACT_CLASS=t,S.DENSITY_COMPACT_SELECTORS=O,S.DENSITY_DEPENDENT_CLASS=d,S.DENSITY_DEPENDENT_SELECTOR=n,S.DENSITY_SELECTORS=R,S.DENSITY_STANDARD_CLASS=$,S.DENSITY_STANDARD_SELECTORS=s,S.INVERT_CLASS="oj-color-invert",S.LIGHT_CLASS="oj-c-colorscheme-light",S.ROOT_SELECTOR=E,S.SCALE_DEFAULT_SELECTORS=N,S.SCALE_DEPENDENT_CLASS=_,S.SCALE_DEPENDENT_SELECTOR=C,S.SCALE_DEPENDENT_SELECTORS=c,S.SCALE_LG_CLASS=o,S.SCALE_LG_SELECTORS=D,S.SCALE_MD_CLASS=e,S.SCALE_MD_SELECTORS=A,S.SCALE_SM_CLASS=L,S.SCALE_SM_SELECTORS=T,S.colorThemes=["light","dark"]}));
//# sourceMappingURL=Theme-d945adae.js.map
;
define('@oracle/oraclejet-preact/theme-a8f3d819',['exports', './Theme-d945adae'], (function(S,A){"use strict";const C=`${A.DARK_CLASS} ${A.INVERT_CLASS}`,E={colorScheme:({colorScheme:S})=>void 0===S?{}:{class:`${"dark"===S?C:A.LIGHT_CLASS} ${A.COLORSCHEME_DEPENDENT_CLASS}`},scale:({scale:S})=>void 0===S?{}:{class:`${"sm"===S?A.SCALE_SM_CLASS:"md"===S?A.SCALE_MD_CLASS:A.SCALE_LG_CLASS} ${A.SCALE_DEPENDENT_CLASS}`},density:({density:S})=>void 0===S?{}:{class:`${"compact"===S?A.DENSITY_COMPACT_CLASS:A.DENSITY_STANDARD_CLASS} ${A.DENSITY_DEPENDENT_CLASS}`}};S.themeInterpolations=E}));
//# sourceMappingURL=theme-a8f3d819.js.map
;
define('@oracle/oraclejet-preact/_curry1-df649359',['exports'], (function(n){"use strict";function t(n){return null!=n&&"object"==typeof n&&!0===n["@@functional/placeholder"]}n._curry1=function(n){return function e(r){return 0===arguments.length||t(r)?e:n.apply(this,arguments)}},n._isPlaceholder=t}));
//# sourceMappingURL=_curry1-df649359.js.map
;
define('@oracle/oraclejet-preact/_curry2-86c52b86',['exports', './_curry1-df649359'], (function(r,e){"use strict";r._curry2=function(r){return function n(c,u){switch(arguments.length){case 0:return n;case 1:return e._isPlaceholder(c)?n:e._curry1((function(e){return r(c,e)}));default:return e._isPlaceholder(c)&&e._isPlaceholder(u)?n:e._isPlaceholder(c)?e._curry1((function(e){return r(e,u)})):e._isPlaceholder(u)?e._curry1((function(e){return r(c,e)})):r(c,u)}}}}));
//# sourceMappingURL=_curry2-86c52b86.js.map
;
define('@oracle/oraclejet-preact/_curry3-83878f86',['exports', './_curry1-df649359', './_curry2-86c52b86'], (function(r,e,c){"use strict";r._curry3=function(r){return function n(u,l,t){switch(arguments.length){case 0:return n;case 1:return e._isPlaceholder(u)?n:c._curry2((function(e,c){return r(u,e,c)}));case 2:return e._isPlaceholder(u)&&e._isPlaceholder(l)?n:e._isPlaceholder(u)?c._curry2((function(e,c){return r(e,l,c)})):e._isPlaceholder(l)?c._curry2((function(e,c){return r(u,e,c)})):e._curry1((function(e){return r(u,l,e)}));default:return e._isPlaceholder(u)&&e._isPlaceholder(l)&&e._isPlaceholder(t)?n:e._isPlaceholder(u)&&e._isPlaceholder(l)?c._curry2((function(e,c){return r(e,c,t)})):e._isPlaceholder(u)&&e._isPlaceholder(t)?c._curry2((function(e,c){return r(e,l,c)})):e._isPlaceholder(l)&&e._isPlaceholder(t)?c._curry2((function(e,c){return r(u,e,c)})):e._isPlaceholder(u)?e._curry1((function(e){return r(e,l,t)})):e._isPlaceholder(l)?e._curry1((function(e){return r(u,e,t)})):e._isPlaceholder(t)?e._curry1((function(e){return r(u,l,e)})):r(u,l,t)}}}}));
//# sourceMappingURL=_curry3-83878f86.js.map
;
define('@oracle/oraclejet-preact/_isObject-42bafc94',['exports'], (function(t){"use strict";t._has=function(t,e){return Object.prototype.hasOwnProperty.call(e,t)},t._isObject=function(t){return"[object Object]"===Object.prototype.toString.call(t)}}));
//# sourceMappingURL=_isObject-42bafc94.js.map
;
define('@oracle/oraclejet-preact/mergeDeepWithKey-aaab9019',['exports', './_curry3-83878f86', './_isObject-42bafc94'], (function(r,e,n){"use strict";var t=e._curry3((function(r,e,t){var c,i={};for(c in t=t||{},e=e||{})n._has(c,e)&&(i[c]=n._has(c,t)?r(c,e[c],t[c]):e[c]);for(c in t)n._has(c,t)&&!n._has(c,i)&&(i[c]=t[c]);return i})),c=e._curry3((function r(e,c,i){return t((function(t,c,i){return n._isObject(c)&&n._isObject(i)?r(e,c,i):e(t,c,i)}),c,i)}));r.mergeDeepWithKey=c}));
//# sourceMappingURL=mergeDeepWithKey-aaab9019.js.map
;
define('@oracle/oraclejet-preact/mergeInterpolations-9ede4cf7',['exports', './classNames-08d99695', './mergeDeepWithKey-aaab9019'], (function(e,s,a){"use strict";const t=(e,a,t)=>"class"===e?s.classNames([a,t]):t;e.mergeInterpolations=e=>s=>e.reduce(((e,c)=>a.mergeDeepWithKey(t,e,c(s))),{})}));
//# sourceMappingURL=mergeInterpolations-9ede4cf7.js.map
;
define('@oracle/oraclejet-preact/useDensity-cb21e58e',['exports', 'preact/hooks', './LayerHost-daf96749', 'preact/jsx-runtime', 'preact/compat'], (function(t,e,n,o,r){"use strict";t.useDensity=function(){return e.useContext(n.EnvironmentContext).density}}));
//# sourceMappingURL=useDensity-cb21e58e.js.map
;
define('@oracle/oraclejet-preact/unsafeDomAccess-602c5dde',['exports'], (function(s){"use strict";const e=Symbol("unsafe_dom_access");s.UNSAFE_DOM_ACCESS=e}));
//# sourceMappingURL=unsafeDomAccess-602c5dde.js.map
;
define('@oracle/oraclejet-preact/useThemeInterpolations-14ffb628',['exports', 'preact/hooks', './useColorScheme-3022ec9a', './useScale-fa445112', './theme-a8f3d819', './mergeInterpolations-9ede4cf7', './LayerHost-daf96749', './Theme-d945adae', './useDensity-cb21e58e', './unsafeDomAccess-602c5dde'], (function(e,t,n,o,s,c,a,r,u,l){"use strict";function i(e){const t=e?.current;return t?t instanceof Element?t:t[l.UNSAFE_DOM_ACCESS]:null}e.toUnsafeDomElement=i,e.useThemeInterpolations=function(e){const[l,m]=t.useState(void 0),f=n.useColorScheme(),d=u.useDensity(),S=o.useScale(),h=d!==a.DefaultEnvironment.density?d:void 0,D=S!==a.DefaultEnvironment.scale?S:void 0;t.useLayoutEffect((()=>{const t=i(e),n=t?.closest(`.${r.INVERT_CLASS}:not(.${r.DARK_CLASS})`);m(f!==a.DefaultEnvironment.colorScheme?f:n?"dark":void 0)}),[e,f]);const E=c.mergeInterpolations([...Object.values(s.themeInterpolations)]),{class:v}=E({colorScheme:l,scale:D,density:h});return v}}));
//# sourceMappingURL=useThemeInterpolations-14ffb628.js.map
;
define('@oracle/oraclejet-preact/Layer-c91c7141',['exports', 'preact/jsx-runtime', 'preact/compat', './LayerHost-daf96749', './classNames-08d99695', './UNSAFE_Layer/themes/LayerStyles.css', './useThemeInterpolations-14ffb628'], (function(e,t,o,s,r,a,l){"use strict";const n=Symbol.for("oj-logical-parent");e.LOGICAL_PARENT=n,e.Layer=({children:e,logicalParentRef:i,isModal:y=!1,priority:c="popup",level:u="nearestAncestor"})=>{const[m,p]=o.useState(null),d=o.useRef(null),L=o.useContext(s.LayerContext),g=e=>{d.current=e,p(e)},f=l.useThemeInterpolations(i);let b=a.styles.popupPriorityStyle;switch(c){case"dialog":b=a.styles.dialogPriorityStyle;break;case"messages":b=a.styles.messagesPriorityStyle;break;case"tooltip":b=a.styles.tooltipPriorityStyle;break;default:b=a.styles.popupPriorityStyle}const S=r.classNames([f,a.baseStyle,b]);o.useLayoutEffect((()=>{const e="topLevel"===u?L.getRootLayerHost?.(c):L.getLayerHost?.(c);if(!e)return;const t=(e.ownerDocument??document).createElement("div");return t.setAttribute("data-oj-layer",y?"modal":"modeless"),i&&(t[n]=l.toUnsafeDomElement(i)),e.appendChild(t),g(t),()=>{e&&t&&e.contains(t)&&(delete t[n],e.removeChild(t)),L.onLayerUnmount&&L.onLayerUnmount(t),g(null)}}),[i,L,u,c,y]),m&&(m.className=S);const H=o.useCallback((()=>m),[m]),P=o.useMemo((()=>L.getLayerHost?{getRootLayerHost:L.getRootLayerHost?.bind(null,c),getLayerHost:H.bind(null)}:{}),[L.getLayerHost,L.getRootLayerHost,H,c]);return t.jsx(s.LayerContext.Provider,{value:P,children:m&&o.createPortal(e,m)})}}));
//# sourceMappingURL=Layer-c91c7141.js.map
;
define('@oracle/oraclejet-preact/UNSAFE_Layer',['exports', './Layer-c91c7141', './LayerManager-8bad71b0', './LayerHost-daf96749', 'preact/jsx-runtime', 'preact/compat', './classNames-08d99695', './UNSAFE_Layer/themes/LayerStyles.css', 'css!./LayerStyles.styles.css', './useThemeInterpolations-14ffb628', 'preact/hooks', './useColorScheme-3022ec9a', './useScale-fa445112', './theme-a8f3d819', './Theme-d945adae', './mergeInterpolations-9ede4cf7', './mergeDeepWithKey-aaab9019', './_curry3-83878f86', './_curry1-df649359', './_curry2-86c52b86', './_isObject-42bafc94', './useDensity-cb21e58e', './unsafeDomAccess-602c5dde', 'preact', './index-f7ad24df', './UNSAFE_Layer/themes/LayerHostStyles.css', 'css!./LayerHostStyles.styles.css'], (function(e,a,s,r,t,c,y,o,L,n,d,f,l,u,m,i,p,_,b,h,S,A,g,x,C,N,E){"use strict";e.LOGICAL_PARENT=a.LOGICAL_PARENT,e.Layer=a.Layer,e.LayerManager=s.LayerManager,e.LayerContext=r.LayerContext,Object.defineProperty(e,"__esModule",{value:!0})}));
//# sourceMappingURL=UNSAFE_Layer.js.map
;
/**
 * @license
 * Copyright (c) 2014, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
define('ojs/ojlayerutils',["exports","ojs/ojcore-base"],function(e,t){"use strict";t=t&&Object.prototype.hasOwnProperty.call(t,"default")?t.default:t;const n="__root_layer_host",o=(e,t,o)=>{let r=null;if("nearestAncestor"===t&&(r=e.closest("[data-oj-layer]")),r)return r;let l=document.getElementById(n);return l||(l=document.createElement("div"),l.setAttribute("id",n),l.setAttribute("data-oj-binding-provider","preact"),l.style.position="relative",l.style.zIndex="999",document.body.prepend(l)),l};e.getLayerContext=function(e){const n=t.VLayerUtils?t.VLayerUtils.getLayerHost:o,r=t.VLayerUtils?t.VLayerUtils.onLayerUnmount:null;return{getRootLayerHost:n.bind(null,e,"topLevel"),getLayerHost:n.bind(null,e,"nearestAncestor"),onLayerUnmount:r?.bind(null,e)}},Object.defineProperty(e,"__esModule",{value:!0})});
//# sourceMappingURL=ojlayerutils.js.map;
/**
 * @license
 * Copyright (c) 2014, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 *
 * This is a fork of the i18n Require.js plugin.
 * It makes minor chnages to the way the default locale is determined and to the way bundles are merged
 *
 * @license RequireJS i18n 2.0.2 Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/requirejs/i18n for details
 */
!function(){"use strict";var e=/(^.*(^|\/)nls(\/|$))([^/]*)\/?([^/]*)/;function n(e,n,o,a,r,t,l){if(n[e]||(e=e.replace(/^zh-(Hans|Hant)-([^-]+)$/,"zh-$2")),n[e]){if(o.push(e),!0===n[e]||1===n[e]){var u=l?l+e:e;a.push(r+u+"/"+t)}return!0}return!1}function o(e){return"object"==typeof e}function a(e,n){for(var r=Object.keys(n),t=0;t<r.length;t++){var l=r[t];null==e[l]?e[l]=n[l]:o(n[l])&&o(e[l])&&a(e[l],n[l])}}define('ojL10n',["module"],function(o){var r=o.config?o.config():{};return{version:"2.0.1+",load:function(o,t,l,u){var c;(u=u||{}).locale&&(r.locale=u.locale);var i,f,s,v,g,h,p,d,y,m,L,O=e.exec(o),_=O[1],b=O[5],j=[],H={},k="";O[5]?(c=(_=O[1])+b,i=O[4]):(c=o,b=O[4],i=r.locale,"undefined"!=typeof document?(i||(i=u.isBuild?"root":document.documentElement.lang)||(i=void 0===navigator?"root":navigator.systemLanguage||navigator.language||navigator.userLanguage||"root"),r.locale=i):i="root"),f=function(e){var n,o=e.toLowerCase().split(/-|_/),a=[o[0]],r=1;for(n=1;n<o.length;n++){var t=o[n],l=t.length;if(1===l)break;switch(r){case 1:if(r=2,4===l){a.push(t.charAt(0).toUpperCase()+t.slice(1));break}case 2:r=3,a.push(t.toUpperCase());break;default:a.push(t)}}return function(e){if(!("zh"!==e[0]||e.length>1&&4===e[1].length)){var n="Hans",o=e.length>1?e[1]:null;"TW"!==o&&"MO"!==o&&"HK"!==o||(n="Hant"),e.splice(1,0,n)}}(a),a}(i),v=r.noOverlay,g=r.defaultNoOverlayLocale;var x=r.localePrefix;for((y=r.merge)&&(h=y[_+b])&&(O=e.exec(h),p=O[1],d=O[4]),m=[],s=0;s<f.length;s++)k+=(k?"-":"")+f[s],m.push(k);u.isBuild?(j.push(c),h&&j.push(h),t(j,function(){l()})):("query"===r.includeLocale&&(c=t.toUrl(c+".js"),c+=(-1===c.indexOf("?")?"?":"&")+"loc="+i),L=[c],h&&L.push(h),t(L,function(e,o){var r=[],u=function(e,o,a){for(var t=v||!0===e.__noOverlay,l=g||e.__defaultNoOverlayLocale,u=!1,c=m.length-1;c>=0&&(!u||!t);c--)u=n(m[c],e,r,j,o,a,x);var i=1===m.length&&"root"===m[0];t&&(i||!u)&&l&&n(l,e,r,j,o,a,x),i||n("root",e,r,j,o,a,x)};u(e,_,b);var c=r.length;o&&u(o,p,d),t(j,function(){var n=function(e,n,o,l,u){for(var c=n;c<o&&r[c];c++){var i=r[c],f=x?x+i:i,s=e[i];!0!==s&&1!==s||(s=t(l+f+"/"+u)),a(H,s||{})}};n(o,c,r.length,p,d),n(e,0,c,_,b),H._ojLocale_=f.join("-"),l(H)})}))}}})}();
define('ojtranslations/nls/ojtranslations',{root:{"oj-message":{fatal:"Fatal",error:"Error",warning:"Warning",info:"Info",confirmation:"Confirmation","compact-type-summary":"{0}: {1}"},"oj-converter":{summary:"Value is not in the expected format.",detail:"Enter a value in the expected format.","plural-separator":", ",hint:{summary:"Example: {exampleValue}",detail:"Try again using a format like this: {exampleValue}.","detail-plural":"Enter a value in these formats: {exampleValue}."},optionHint:{detail:"An accepted value for option '{propertyName}' is '{propertyValueValid}'.","detail-plural":"Accepted values for option '{propertyName}' are '{propertyValueValid}'."},optionTypesMismatch:{summary:"A value for the option '{requiredPropertyName}' is required when the option '{propertyName}' is set to '{propertyValue}'."},optionTypeInvalid:{summary:"A value of the expected type was not provided for option '{propertyName}'."},optionOutOfRange:{summary:"Value {propertyValue} is out of range for the option '{propertyName}'."},optionValueInvalid:{summary:"An invalid value '{propertyValue}' was specified for the option '{propertyName}'."},number:{decimalFormatMismatch:{summary:"The provided value is not in the expected number format."},shortLongUnsupportedParse:{summary:"'short' and 'long' are not supported for converter parsing.",detail:"Change component to readonly. readonly fields do not call the converter's parse function."},currencyFormatMismatch:{summary:"The provided value is not in the expected currency format."},percentFormatMismatch:{summary:"The provided value is not in the expected percent format."},invalidNumberFormat:{summary:"The provided value is not a valid number.",detail:"Please provide valid number."},parseError:{detail:"Enter a number."}},color:{invalidFormat:{summary:"Invalid color format.",detail:"Invalid color format option specification."},invalidSyntax:{summary:"Invalid color specification.",detail:"Enter a color value that conforms to the CSS3 standard."}},datetime:{datetimeOutOfRange:{summary:"Value '{value}' is out of range for the '{propertyName}'.",detail:"Enter a value between '{minValue}' and '{maxValue}'.",hour:"hour",minute:"minute",second:"second",millisec:"millisec",month:"month",day:"day",year:"year","month name":"month name",weekday:"weekday"},dateFormatMismatch:{summary:"The provided value is not in the expected date format."},invalidTimeZoneID:{summary:"Invalid timezone id {timeZoneID} provided."},nonExistingTime:{summary:"The input time does not exist because it falls during the transition to daylight saving time."},missingTimeZoneData:{summary:"TimeZone data is missing. Please call require 'ojs/ojtimezonedata' in order to load the TimeZone data."},timeFormatMismatch:{summary:"The provided value is not in the expected time format."},datetimeFormatMismatch:{summary:"The provided value is not in the expected date and time format."},dateToWeekdayMismatch:{summary:"Day '{date}' does not fall on a '{weekday}'.",detail:"Enter a weekday that corresponds with the date."},invalidISOString:{invalidRangeSummary:"The value '{value}' is out of range for the '{propertyName}' field in the ISO 8601 string '{isoStr}'.",summary:"The provided '{isoStr}' is not a valid ISO 8601 string.",detail:"Please provide valid ISO 8601 string."}}},"oj-validator":{length:{hint:{min:"Enter {min} or more characters.",max:"Enter {max} or fewer characters.",inRange:"Enter {min} to {max} characters.",exact:"Enter {length} characters."},messageDetail:{tooShort:"Enter {min} or more characters.",tooLong:"Enter no more than {max} characters."},messageSummary:{tooShort:"There are too few characters.",tooLong:"There are too many characters."}},range:{number:{hint:{min:"Enter a number greater than or equal to {min}.",max:"Enter a number less than or equal to {max}.",inRange:"Enter a number between {min} and {max}.",exact:"Enter the number {num}."},messageDetail:{rangeUnderflow:"Enter a number that's {min} or higher.",rangeOverflow:"Enter a number that's {max} or lower.",exact:"Enter the number {num}."},messageSummary:{rangeUnderflow:"The number is too low.",rangeOverflow:"The number is too high."}},datetime:{hint:{min:"Enter a date and time on or after {min}.",max:"Enter a date and time on or before {max}.",inRange:"Enter a date and time between {min} and {max}."},messageDetail:{rangeUnderflow:"Enter a date and time that's on or after {min}.",rangeOverflow:"Enter a date and time that's on or before {max}."},messageSummary:{rangeUnderflow:"Date and time is earlier than the minimum date and time.",rangeOverflow:"Date and time is later than the maximum date and time."}},date:{hint:{min:"Enter a date on or after {min}.",max:"Enter a date on or before {max}.",inRange:"Enter a date between {min} and {max}."},messageDetail:{rangeUnderflow:"Enter a date that's on or after {min}.",rangeOverflow:"Enter a date that's on or before {max}."},messageSummary:{rangeUnderflow:"Date is earlier than the minimum date.",rangeOverflow:"Date is later than the maximum date."}},time:{hint:{min:"Enter a time on or after {min}.",max:"Enter a time on or before {max}.",inRange:"Enter a time between {min} and {max}."},messageDetail:{rangeUnderflow:"Enter a time that's {min} or later.",rangeOverflow:"Enter a time that's {max} or earlier."},messageSummary:{rangeUnderflow:"Time is earlier than the minimum time.",rangeOverflow:"Time is later than the maximum time."}}},restriction:{date:{messageSummary:"Date {value} is of a disabled entry.",messageDetail:"The date you selected isn't available. Try another date."}},regExp:{summary:"Format is incorrect.",detail:"Enter allowable values described in this regular expression: '{pattern}'."},required:{summary:"Value is required.",detail:"Enter a value."}},"oj-ojEditableValue":{loading:"Loading",requiredText:"Required",helpSourceText:"Learn more..."},"oj-ojInputDate":{done:"Done",cancel:"Cancel",time:"Time",accessibleClearIconAltText:"Clear input",prevText:"Previous",nextText:"Next",currentText:"Today",weekHeader:"Wk",tooltipCalendar:"Select Date.",tooltipCalendarTime:"Select Date Time.",tooltipCalendarDisabled:"Select Date Disabled.",tooltipCalendarTimeDisabled:"Select Date Time Disabled.",setTime:"Set Time",setDate:"Set Date",picker:"Picker",weekText:"Week",datePicker:"Date Picker",dateTimePicker:"Date and Time Picker",inputHelp:"Press Key down or Key up for access to Calendar.",inputHelpBoth:"Press Key down or Key up for access to Calendar and Shift + Key down or Shift Key up for access to time drop down.",dateTimeRange:{hint:{min:"",max:"",inRange:""},messageDetail:{rangeUnderflow:"",rangeOverflow:""},messageSummary:{rangeUnderflow:"",rangeOverflow:""}},dateRestriction:{hint:"",messageSummary:"",messageDetail:""},accessibleMaxLengthExceeded:"Maximum length {len} exceeded.",accessibleMaxLengthRemaining:"{chars} characters left.",regexp:{messageSummary:"",messageDetail:""},required:{hint:""}},"oj-ojInputTime":{accessibleClearIconAltText:"Clear input",cancelText:"Cancel",okText:"OK",currentTimeText:"Now",hourWheelLabel:"Hour",minuteWheelLabel:"Minute",ampmWheelLabel:"AMPM",tooltipTime:"Select Time.",tooltipTimeDisabled:"Select Time Disabled.",inputHelp:"Press Key down or Key up for access to time drop down.",dateTimeRange:{hint:{min:"",max:"",inRange:""},messageDetail:{rangeUnderflow:"",rangeOverflow:""},messageSummary:{rangeUnderflow:"",rangeOverflow:""}}},"oj-inputBase":{required:{hint:"",messageSummary:"",messageDetail:""},regexp:{messageSummary:"",messageDetail:""},accessibleMaxLengthExceeded:"Maximum length {len} exceeded.",accessibleMaxLengthRemaining:"{chars} characters left."},"oj-ojInputText":{accessibleClearIcon:"Clear"},"oj-ojInputPassword":{regexp:{messageDetail:"Value must match this pattern: '{pattern}'."},accessibleShowPassword:"Show password.",accessibleHidePassword:"Hide password."},"oj-ojFilmStrip":{labelAccFilmStrip:"Displaying page {pageIndex} of {pageCount}",labelAccArrowNextPage:"Select Next to display next page",labelAccArrowPreviousPage:"Select Previous to display previous page",tipArrowNextPage:"Next",tipArrowPreviousPage:"Previous"},"oj-ojDataGrid":{accessibleSortAscending:"{id} sorted in ascending order",accessibleSortDescending:"{id} sorted in descending order",accessibleSortable:"{id} sortable",accessibleActionableMode:"Enter actionable mode.",accessibleNavigationMode:"Enter navigation mode, press F2 to enter edit or actionable mode.",accessibleEditableMode:"Enter editable mode, press escape to navigate outside the data grid.",accessibleSummaryExact:"This is a data grid with {rownum} rows and {colnum} columns",accessibleSummaryEstimate:"This is a data grid with unknown number of rows and columns",accessibleSummaryExpanded:"There are currently {num} rows expanded",accessibleRowExpanded:"Row expanded",accessibleExpanded:"Expanded",accessibleRowCollapsed:"Row collapsed",accessibleCollapsed:"Collapsed",accessibleRowSelected:"Row {row} selected",accessibleColumnSelected:"Column {column} selected",accessibleStateSelected:"selected",accessibleMultiCellSelected:"{num} cells selected",accessibleColumnSpanContext:"{extent} wide",accessibleRowSpanContext:"{extent} high",accessibleRowContext:"Row {index}",accessibleColumnContext:"Column {index}",accessibleRowHeaderContext:"Row Header {index}",accessibleColumnHeaderContext:"Column Header {index}",accessibleRowEndHeaderContext:"Row End Header {index}",accessibleColumnEndHeaderContext:"Column End Header {index}",accessibleRowHeaderLabelContext:"Row Header Label {level}",accessibleColumnHeaderLabelContext:"Column Header Label {level}",accessibleRowEndHeaderLabelContext:"Row End Header Label {level}",accessibleColumnEndHeaderLabelContext:"Column End Header Label {level}",accessibleLevelContext:"Level {level}",accessibleRangeSelectModeOn:"Add selected range of cells mode on.",accessibleRangeSelectModeOff:"Add selected range of cells mode off.",accessibleFirstRow:"You have reached the first row.",accessibleLastRow:"You have reached the last row.",accessibleFirstColumn:"You have reached the first column",accessibleLastColumn:"You have reached the last column.",accessibleEndOfDataGrid:"End of data grid.",accessibleSelectionAffordanceTop:"Top selection handle.",accessibleSelectionAffordanceBottom:"Bottom selection handle.",accessibleLevelHierarchicalContext:"Level {level}",accessibleRowHierarchicalFull:"Row {posInSet} of {setSize} rows",accessibleRowHierarchicalPartial:"Row {posInSet} of at least {setSize} rows",accessibleRowHierarchicalUnknown:"At least row {posInSet} of at least {setSize} rows",accessibleColumnHierarchicalFull:"Column {posInSet} of {setSize} columns",accessibleColumnHierarchicalPartial:"Column {posInSet} of at least {setSize} columns",accessibleColumnHierarchicalUnknown:"At least column {posInSet} of at least {setSize} columns",accessibleFilterable:"Filterable",accessibleFiltered:"Filtered",msgFetchingData:"Fetching Data...",msgNoData:"No items to display.",msgReadOnly:"This cell is read-only and can't be edited.",labelHideColumns:"Hide Columns",labelHideRows:"Hide Rows",labelUnhideColumns:"Unhide Columns",labelUnhideRows:"Unhide Rows",labelResize:"Resize",labelResizeWidth:"Resize Width",labelResizeHeight:"Resize Height",labelSortAsc:"Sort Ascending",labelSortDsc:"Sort Descending",labelSortRow:"Sort Row",labelSortRowAsc:"Sort Row Ascending",labelSortRowDsc:"Sort Row Descending",labelSortCol:"Sort Column",labelSortColAsc:"Sort Column Ascending",labelSortColDsc:"Sort Column Descending",labelFilter:"Filter",labelFilterCol:"Filter Column",labelCut:"Cut",labelPaste:"Paste",labelCutCells:"Cut",labelPasteCells:"Paste",labelCopyCells:"Copy",labelAutoFill:"Autofill",labelEnableNonContiguous:"Enable Non-Contiguous Selection",labelDisableNonContiguous:"Disable Non-Contiguous Selection",labelResizeDialogSubmit:"OK",labelResizeDialogCancel:"Cancel",accessibleContainsControls:"Contains Controls",labelSelectMultiple:"Select Multiple",labelResizeDialogApply:"Apply",labelResizeFitToContent:"Resize to Fit",columnWidth:"Width in Pixels",rowHeight:"Height in Pixels",labelResizeColumn:"Resize Column",labelResizeRow:"Resize Row",resizeColumnDialog:"Resize column",resizeRowDialog:"Resize row",labelFreezeRow:"Freeze Rows",labelFreezeCol:"Freeze Columns",labelUnfreezeRow:"Unfreeze Rows",labelUnfreezeCol:"Unfreeze Columns",collapsedText:"Collapse",expandedText:"Expand",tooltipRequired:"Required"},"oj-ojRowExpander":{accessibleLevelDescription:"Level {level}",accessibleRowDescription:"Level {level}, Row {num} of {total}",accessibleRowDescriptionAtLeast:"Level {level}, Row {num} of at least {total}",accessibleRowExpanded:"Row expanded",accessibleRowCollapsed:"Row collapsed",accessibleStateExpanded:"expanded",accessibleStateCollapsed:"collapsed"},"oj-ojStreamList":{msgFetchingData:"Fetching Data..."},"oj-ojListView":{msgFetchingData:"Loading",msgNoData:"No items to display.",msgItemsAppended:"{count} items appended to the end.",msgFetchCompleted:"Loaded",indexerCharacters:"A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z",accessibleExpandCollapseInstructionText:"Use arrow keys to expand and collapse.",accessibleGroupExpand:"Expanded",accessibleGroupCollapse:"Collapsed",accessibleReorderTouchInstructionText:"Double tap and hold.  Wait for the sound then drag to rearrange.",accessibleReorderBeforeItem:"Before {item}",accessibleReorderAfterItem:"After {item}",accessibleReorderInsideItem:"Into {item}",accessibleNavigateSkipItems:"Skipping {numSkip} items",accessibleSuggestion:"Suggestion",labelCut:"Cut",labelCopy:"Copy",labelPaste:"Paste",labelPasteBefore:"Paste Before",labelPasteAfter:"Paste After"},"oj-ojWaterfallLayout":{msgFetchingData:"Fetching Data..."},"oj-_ojLabel":{tooltipHelp:"Help",tooltipRequired:"Required"},"oj-ojLabel":{tooltipHelp:"Help",tooltipRequired:"Required"},"oj-ojInputNumber":{required:{hint:"",messageSummary:"",messageDetail:""},numberRange:{hint:{min:"",max:"",inRange:"",exact:""},messageDetail:{rangeUnderflow:"",rangeOverflow:"",exact:""},messageSummary:{rangeUnderflow:"",rangeOverflow:""}},tooltipDecrement:"Decrement",tooltipIncrement:"Increment"},"oj-ojTable":{accessibleAddRow:"Enter data to add a new row.",accessibleColumnContext:"Column {index}",accessibleColumnFooterContext:"Column Footer {index}",accessibleColumnHeaderContext:"Column Header {index}",accessibleContainsControls:"Contains Controls",accessibleColumnsSpan:"Spans {count} Columns",accessibleEditableSummary:"Press F2 to focus read only controls or enter to begin editing",accessibleRowContext:"Row {index}",accessibleSortable:"{id} sortable",accessibleSortAscending:"{id} sorted in ascending order",accessibleSortDescending:"{id} sorted in descending order",accessibleStateSelected:"selected",accessibleStateUnselected:"unselected",accessibleSummaryEstimate:"Table with {colnum} columns and more than {rownum} rows",accessibleSummaryExact:"Table with {colnum} columns and {rownum} rows",labelAccSelectionAffordanceTop:"Top selection handle",labelAccSelectionAffordanceBottom:"Bottom selection handle",labelEnableNonContiguousSelection:"Enable Non-Contiguous Selection",labelDisableNonContiguousSelection:"Disable Non-Contiguous Selection",labelResize:"Resize",labelResizeColumn:"Resize Column",labelResizePopupSubmit:"OK",labelResizePopupCancel:"Cancel",labelResizePopupSpinner:"Resize Column",labelResizeColumnDialog:"Resize column",labelColumnWidth:"Width in Pixels",labelResizeDialogApply:"Apply",labelSelectRow:"Select Row",labelSelectAllRows:"Select All Rows",labelEditRow:"Edit Row",labelSelectAndEditRow:"Select And Edit Row",labelSelectColumn:"Select Column",labelSort:"Sort",labelSortAsc:"Sort Ascending",labelSortDsc:"Sort Descending",msgFetchingData:"Fetching Data...",msgNoData:"No data to display.",msgInitializing:"Initializing...",msgColumnResizeWidthValidation:"Width value must be an integer.",msgScrollPolicyMaxCountSummary:"Exceeded maximum rows for table scrolling.",msgScrollPolicyMaxCountDetail:"Please reload with smaller data set.",msgStatusSortAscending:"{0} sorted in ascending order.",msgStatusSortDescending:"{0} sorted in descending order.",tooltipRequired:"Required",tooltipSeparator:" - "},"oj-ojTabs":{labelCut:"Cut",labelPasteBefore:"Paste Before",labelPasteAfter:"Paste After",labelRemove:"Remove",labelReorder:"Reorder",removeCueText:"Removable"},"oj-ojCheckboxset":{readonlyNoValue:"",required:{hint:"",messageSummary:"",messageDetail:"Select a value."}},"oj-ojRadioset":{readonlyNoValue:"",required:{hint:"",messageSummary:"",messageDetail:"Select a value."}},"oj-ojSelect":{required:{hint:"",messageSummary:"",messageDetail:"Select a value."},searchField:"{label} search",noMatchesFound:"No matches found",noMoreResults:"No more results",oneMatchesFound:"One match found",moreMatchesFound:"{num} matches found",filterFurther:"More results available, please filter further."},"oj-ojSwitch":{SwitchON:"On",SwitchOFF:"Off"},"oj-ojCombobox":{required:{hint:"",messageSummary:"",messageDetail:""},noMatchesFound:"No matches found",noMoreResults:"No more results",oneMatchesFound:"One match found",moreMatchesFound:"{num} matches found",filterFurther:"More results available, please filter further."},"oj-ojSelectSingle":{required:{hint:"",messageSummary:"",messageDetail:"Select a value."},noMatchesFound:"No matches found",oneMatchFound:"One match found",multipleMatchesFound:"{num} matches found",nOrMoreMatchesFound:"{num} or more matches found",cancel:"Cancel",labelAccOpenDropdown:"expand",labelAccClearValue:"clear value",noResultsLine1:"No results found",noResultsLine2:"We can't find anything matching your search."},"oj-ojInputSearch2":{cancel:"Cancel",noSuggestionsFound:"No suggestions found"},"oj-ojInputSearch":{required:{hint:"",messageSummary:"",messageDetail:""},noMatchesFound:"No matches found",oneMatchesFound:"One match found",moreMatchesFound:"{num} matches found"},"oj-ojTreeView":{treeViewSelectorAria:"TreeView Selector {rowKey}",retrievingDataAria:"Retrieving data for node: {nodeText}",receivedDataAria:"Received data for node: {nodeText}"},"oj-ojTree":{stateLoading:"Loading...",labelNewNode:"New Node",labelMultiSelection:"Multiple Selection",labelEdit:"Edit",labelCreate:"Create",labelCut:"Cut",labelCopy:"Copy",labelPaste:"Paste",labelPasteAfter:"Paste After",labelPasteBefore:"Paste Before",labelRemove:"Remove",labelRename:"Rename",labelNoData:"No data"},"oj-ojPagingControl":{labelAccPaging:"Pagination",labelAccPageNumber:"Page {pageNum} content loaded",labelAccNavFirstPage:"First Page",labelAccNavLastPage:"Last Page",labelAccNavNextPage:"Next Page",labelAccNavPreviousPage:"Previous Page",labelAccNavPage:"Page",labelLoadMore:"Show More...",labelLoadMoreMaxRows:"Reached Maximum Limit of {maxRows} rows",labelNavInputPage:"Page",labelNavInputPageMax:"of {pageMax}",fullMsgItemRange:"{pageFrom}-{pageTo} of {pageMax} items",fullMsgItemRangeAtLeast:"{pageFrom}-{pageTo} of at least {pageMax} items",fullMsgItemRangeApprox:"{pageFrom}-{pageTo} of approx {pageMax} items",msgItemRangeNoTotal:"{pageFrom}-{pageTo} items",fullMsgItem:"{pageTo} of {pageMax} items",fullMsgItemAtLeast:"{pageTo} of at least {pageMax} items",fullMsgItemApprox:"{pageTo} of approx {pageMax} items",msgItemNoTotal:"{pageTo} items",msgItemRangeCurrent:"{pageFrom}-{pageTo}",msgItemRangeCurrentSingle:"{pageFrom}",msgItemRangeOf:"of",msgItemRangeOfAtLeast:"of at least",msgItemRangeOfApprox:"of approx.",msgItemRangeItems:"items",tipNavInputPage:"Go To Page",tipNavPageLink:"Go To Page {pageNum}",tipNavNextPage:"Next",tipNavPreviousPage:"Previous",tipNavFirstPage:"First",tipNavLastPage:"Last",pageInvalid:{summary:"The page value entered is invalid.",detail:"Please enter a value greater than 0."},maxPageLinksInvalid:{summary:"Value for maxPageLinks is invalid.",detail:"Please enter a value greater than 4."}},"oj-ojMasonryLayout":{labelCut:"Cut",labelPasteBefore:"Paste Before",labelPasteAfter:"Paste After"},"oj-panel":{labelAccButtonExpand:"Expand",labelAccButtonCollapse:"Collapse",labelAccButtonRemove:"Remove",labelAccFlipForward:"Flip forward",labelAccFlipBack:"Flip back",tipDragToReorder:"Drag to reorder",labelAccDragToReorder:"Drag to reorder, context menu available"},"oj-ojChart":{labelDefaultGroupName:"Group {0}",labelSeries:"Series",labelGroup:"Group",labelDate:"Date",labelValue:"Value",labelDataLabel:"Label",labelTargetValue:"Target",labelX:"X",labelY:"Y",labelZ:"Z",labelPercentage:"Percentage",labelLow:"Low",labelHigh:"High",labelOpen:"Open",labelClose:"Close",labelVolume:"Volume",labelQ1:"Q1",labelQ2:"Q2",labelQ3:"Q3",labelMin:"Min",labelMax:"Max",labelOther:"Other",tooltipPan:"Pan",tooltipSelect:"Marquee select",tooltipZoom:"Marquee zoom",stateLoading:"Loading",stateLoaded:"Loaded",componentName:"Chart"},"oj-dvtBaseGauge":{componentName:"Gauge"},"oj-ojDiagram":{promotedLink:"{0} link",promotedLinks:"{0} links",promotedLinkAriaDesc:"Indirect",componentName:"Diagram"},"oj-ojGantt":{componentName:"Gantt",accessibleDurationDays:"{0} days",accessibleDurationHours:"{0} hours",accessibleTaskInfo:"Start time is {0}, end time is {1}, duration is {2}",accessibleMilestoneInfo:"Time is {0}",accessibleRowInfo:"Row {0}",accessibleTaskTypeMilestone:"Milestone",accessibleTaskTypeSummary:"Summary",accessiblePredecessorInfo:"{0} predecessors",accessibleSuccessorInfo:"{0} successors",accessibleDependencyInfo:"Dependency type {0}, connects {1} to {2}",startStartDependencyAriaDesc:"start to start",startFinishDependencyAriaDesc:"start to finish",finishStartDependencyAriaDesc:"finish to start",finishFinishDependencyAriaDesc:"finish to finish",tooltipZoomIn:"Zoom In",tooltipZoomOut:"Zoom Out",labelLevel:"Level",labelRow:"Row",labelStart:"Start",labelEnd:"End",labelDate:"Date",labelBaselineStart:"Baseline Start",labelBaselineEnd:"Baseline End",labelBaselineDate:"Baseline Date",labelDowntimeStart:"Downtime Start",labelDowntimeEnd:"Downtime End",labelOvertimeStart:"Overtime Start",labelOvertimeEnd:"Overtime End",labelAttribute:"Attribute",labelLabel:"Label",labelProgress:"Progress",labelMoveBy:"Move By",labelResizeBy:"Resize By",taskMoveInitiated:"Task move initiated",rowAxisLabel:"Row labels",taskResizeEndInitiated:"Task resize end initiated",taskResizeStartInitiated:"Task resize start initiated",taskMoveSelectionInfo:"{0} others selected",taskResizeSelectionInfo:"{0} others selected",taskMoveInitiatedInstruction:"Use the arrow keys to move",taskResizeInitiatedInstruction:"Use the arrow keys to resize",taskMoveFinalized:"Task move finalized",taskResizeFinalized:"Task resize finalized",taskMoveCancelled:"Task move cancelled",taskResizeCancelled:"Task resize cancelled",taskResizeStartHandle:"Task resize start handle",taskResizeEndHandle:"Task resize end handle"},"oj-ojLegend":{componentName:"Legend",tooltipExpand:"Expand",tooltipCollapse:"Collapse",labelInvalidData:"Invalid data",labelNoData:"No data to display",labelClearSelection:"Clear Selection",stateSelected:"Selected",stateUnselected:"Unselected",stateMaximized:"Maximized",stateMinimized:"Minimized",stateIsolated:"Isolated",labelCountWithTotal:"{0} of {1}",accessibleContainsControls:"Contains Controls"},"oj-ojNBox":{highlightedCount:"{0}/{1}",labelOther:"Other",labelGroup:"Group",labelSize:"Size",labelAdditionalData:"Additional Data",componentName:"{0} Box"},"oj-ojPictoChart":{componentName:"Picture Chart"},"oj-ojSparkChart":{componentName:"Chart"},"oj-ojSunburst":{labelColor:"Color",labelSize:"Size",tooltipExpand:"Expand",tooltipCollapse:"Collapse",stateLoading:"Loading",stateLoaded:"Loaded",componentName:"Sunburst"},"oj-ojTagCloud":{componentName:"Tag Cloud",accessibleContainsControls:"Contains Controls",labelCountWithTotal:"{0} of {1}",labelInvalidData:"Invalid data",stateCollapsed:"Collapsed",stateDrillable:"Drillable",stateExpanded:"Expanded",stateIsolated:"Isolated",stateHidden:"Hidden",stateMaximized:"Maximized",stateMinimized:"Minimized",stateVisible:"Visible"},"oj-ojThematicMap":{componentName:"Thematic Map",areasRegion:"Areas",linksRegion:"Links",markersRegion:"Markers"},"oj-ojTimeAxis":{componentName:"Time Axis"},"oj-ojTimeline":{componentName:"Timeline",stateMinimized:"Minimized",stateMaximized:"Maximized",stateIsolated:"Isolated",stateHidden:"Hidden",stateExpanded:"Expanded",stateVisible:"Visible",stateDrillable:"Drillable",stateCollapsed:"Collapsed",labelCountWithTotal:"{0} of {1}",accessibleItemDesc:"Description is {0}.",accessibleItemEnd:"End time is {0}.",accessibleItemStart:"Start time is {0}.",accessibleItemTitle:"Title is {0}.",labelSeries:"Series",tooltipZoomIn:"Zoom In",tooltipZoomOut:"Zoom Out",labelStart:"Start",labelEnd:"End",labelAccNavNextPage:"Next Page",labelAccNavPreviousPage:"Previous Page",tipArrowNextPage:"Next",tipArrowPreviousPage:"Previous",navArrowDisabledState:"Disabled",labelDate:"Date",labelTitle:"Title",labelDescription:"Description",labelMoveBy:"Move By",labelResizeBy:"Resize By",itemMoveInitiated:"Event move initiated",itemResizeEndInitiated:"Event resize end initiated",itemResizeStartInitiated:"Event resize start initiated",itemMoveSelectionInfo:"{0} others selected",itemResizeSelectionInfo:"{0} others selected",itemMoveInitiatedInstruction:"Use the arrow keys to move",itemResizeInitiatedInstruction:"Use the arrow keys to resize",itemMoveFinalized:"Event move finalized",itemResizeFinalized:"Event resize finalized",itemMoveCancelled:"Event move cancelled",itemResizeCancelled:"Event resize cancelled",itemResizeStartHandle:"Event resize start handle",itemResizeEndHandle:"Event resize end handle"},"oj-ojTreemap":{labelColor:"Color",labelSize:"Size",tooltipIsolate:"Isolate",tooltipRestore:"Restore",stateLoading:"Loading",stateLoaded:"Loaded",componentName:"Treemap"},"oj-dvtBaseComponent":{labelScalingSuffixThousand:"K",labelScalingSuffixMillion:"M",labelScalingSuffixBillion:"B",labelScalingSuffixTrillion:"T",labelScalingSuffixQuadrillion:"Q",labelInvalidData:"Invalid data",labelNoData:"No data to display",labelClearSelection:"Clear Selection",labelDataVisualization:"Data Visualization",stateSelected:"Selected",stateUnselected:"Unselected",stateMaximized:"Maximized",stateMinimized:"Minimized",stateExpanded:"Expanded",stateCollapsed:"Collapsed",stateIsolated:"Isolated",stateHidden:"Hidden",stateVisible:"Visible",stateDrillable:"Drillable",labelAndValue:"{0}: {1}",labelCountWithTotal:"{0} of {1}",accessibleContainsControls:"Contains Controls"},"oj-ojRatingGauge":{labelClearSelection:"Clear Selection",stateSelected:"Selected",stateUnselected:"Unselected",stateMaximized:"Maximized",stateMinimized:"Minimized",stateExpanded:"Expanded",stateCollapsed:"Collapsed",stateIsolated:"Isolated",stateHidden:"Hidden",stateVisible:"Visible",stateDrillable:"Drillable",labelCountWithTotal:"{0} of {1}",accessibleContainsControls:"Contains Controls"},"oj-ojStatusMeterGauge":{labelClearSelection:"Clear Selection",stateSelected:"Selected",stateUnselected:"Unselected",stateMaximized:"Maximized",stateMinimized:"Minimized",stateExpanded:"Expanded",stateCollapsed:"Collapsed",stateIsolated:"Isolated",stateHidden:"Hidden",stateVisible:"Visible",stateDrillable:"Drillable",labelCountWithTotal:"{0} of {1}",accessibleContainsControls:"Contains Controls"},"oj-ojNavigationList":{defaultRootLabel:"Navigation List",hierMenuBtnLabel:"Hierarchical Menu button",selectedLabel:"selected",previousIcon:"Previous",msgFetchingData:"Fetching Data...",msgNoData:"",overflowItemLabel:"More Tabs",accessibleReorderTouchInstructionText:"Double tap and hold.  Wait for the sound then drag to rearrange.",accessibleReorderBeforeItem:"Before {item}",accessibleReorderAfterItem:"After {item}",labelCut:"Cut",labelPasteBefore:"Paste Before",labelPasteAfter:"Paste After",labelRemove:"Remove",removeCueText:"Removable",accessibleExpandCollapseInstructionText:"Use arrow keys to expand and collapse.",labelActions:"Actions",labelMoveLeft:"Move Left",labelMoveRight:"Move Right",labelContextMenu:"has context menu"},"oj-ojSlider":{noValue:"ojSlider has no value",maxMin:"Max must not be less than or equal to min",startEnd:"value.start must not be greater than value.end",valueRange:"Value must be within min to max range",optionNum:"{option} option is not a number",invalidStep:"Invalid step; step must be > 0",lowerValueThumb:"lower value thumb",higherValueThumb:"higher value thumb"},"oj-ojDialog":{labelCloseIcon:"Close"},"oj-ojPopup":{ariaLiveRegionInitialFocusFirstFocusable:"Entering pop-up. Press F6 to navigate between the pop-up and associated control.",ariaLiveRegionInitialFocusNone:"Pop-up opened. Press F6 to navigate between the pop-up and associated control.",ariaLiveRegionInitialFocusFirstFocusableTouch:"Entering pop-up. Pop-up can be closed by navigating to the last link within the pop-up.",ariaLiveRegionInitialFocusNoneTouch:"Pop-up opened. Navigate to the next link to establish focus within the pop-up.",ariaFocusSkipLink:"Double tap to navigate to the open pop-up.",ariaCloseSkipLink:"Double tap to close the open pop-up."},"oj-ojRefresher":{ariaRefreshLink:"Activate link to refresh content",ariaRefreshingLink:"Refreshing content",ariaRefreshCompleteLink:"Refresh complete"},"oj-ojSwipeActions":{ariaShowStartActionsDescription:"Show start actions",ariaShowEndActionsDescription:"Show end actions",ariaHideActionsDescription:"Hide actions"},"oj-ojIndexer":{indexerCharacters:"A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z",indexerOthers:"#",ariaDisabledLabel:"No matching group header",ariaOthersLabel:"number",ariaInBetweenText:"Between {first} and {second}",ariaKeyboardInstructionText:"Press enter to select value.",ariaTouchInstructionText:"Double tap and hold to enter gesture mode, then drag up or down to adjust value."},"oj-ojMenu":{labelCancel:"Cancel",ariaFocusSkipLink:"Focus is within the menu, double tap or swipe to move focus to the first menu item."},"oj-ojColorSpectrum":{labelHue:"Hue",labelOpacity:"Opacity",labelSatLum:"Saturation/Luminance",labelThumbDesc:"Color spectrum four way slider."},"oj-ojColorPalette":{labelNone:"None"},"oj-ojColorPicker":{labelSwatches:"Swatches",labelCustomColors:"Custom Colors",labelPrevColor:"Previous Color",labelDefColor:"Default Color",labelDelete:"Delete",labelDeleteQ:"Delete?",labelAdd:"Add",labelAddColor:"Add color",labelMenuHex:"HEX",labelMenuRgba:"RGBa",labelMenuHsla:"HSLa",labelSliderHue:"Hue",labelSliderSaturation:"Saturation",labelSliderSat:"Sat",labelSliderLightness:"Lightness",labelSliderLum:"Luminosity",labelSliderAlpha:"Alpha",labelOpacity:"Opacity",labelSliderRed:"Red",labelSliderGreen:"Green",labelSliderBlue:"Blue"},"oj-ojFilePicker":{dropzoneText:"Drop files here or click to upload",singleFileUploadError:"Upload one file at a time.",singleFileTypeUploadError:"You can't upload files of type {fileType}.",multipleFileTypeUploadError:"You can't upload files of type: {fileTypes}.",dropzonePrimaryText:"Drag and Drop",secondaryDropzoneText:"Select a file or drop one here.",secondaryDropzoneTextMultiple:"Select or drop files here.",unknownFileType:"unknown"},"oj-ojProgressbar":{ariaIndeterminateProgressText:"In Progress"},"oj-ojMessage":{labelCloseIcon:"Close",categories:{error:"Error",warning:"Warning",info:"Information",confirmation:"Confirmation",none:"None"}},"oj-ojMessages":{labelLandmark:"Messages",ariaLiveRegion:{navigationFromKeyboard:"Entering messages region. Press F6 to navigate back to prior focused element.",navigationToTouch:"Messages region has new messages.",navigationToKeyboard:"Messages region has new messages. Press F6 to navigate.",newMessage:"Message category {category}. {summary}. {detail}.",noDetail:"Detail is not available"}},"oj-ojMessageBanner":{close:"Close",navigationFromMessagesRegion:"Entering messages region. Press F6 to navigate back to prior focused element.",navigationToMessagesRegion:"Messages region has new messages. Press F6 to navigate.",navigationToTouch:"Messages region has new messages.",error:"Error",warning:"Warning",info:"Information",confirmation:"Confirmation"},"oj-ojConveyorBelt":{tipArrowNext:"Next",tipArrowPrevious:"Previous"},"oj-ojTrain":{stepInfo:"Step {index} out of {count}.",stepStatus:"Status: {status}.",stepCurrent:"Current",stepVisited:"Visited",stepNotVisited:"Not visited",stepDisabled:"Disabled",stepMessageType:"Message type: {messageType}.",stepMessageConfirmation:"Confirmed",stepMessageInfo:"Info",stepMessageWarning:"Warning",stepMessageError:"Error"}},ar:1,"ar-XB":1,bg:1,bs:1,"bs-Cyrl":1,cs:1,da:1,de:1,el:1,"en-XA":1,"en-XC":1,es:1,et:1,fi:1,fr:1,"fr-CA":1,he:1,hr:1,hu:1,is:1,it:1,ja:1,ko:1,lt:1,lv:1,ms:1,nl:1,no:1,pl:1,pseudo:1,pt:1,"pt-PT":1,ro:1,ru:1,sk:1,sl:1,sr:1,"sr-Latn":1,sv:1,th:1,tr:1,uk:1,vi:1,"zh-Hans":1,"zh-Hant":1});

/**
 * @license
 * Copyright (c) 2014, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
define('ojs/ojconfig',["require","exports","ojs/ojcore-base","ojL10n!ojtranslations/nls/ojtranslations","ojs/ojcustomelement-utils"],function(e,t,n,o,r){"use strict";function i(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var o=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,o.get?o:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t}n=n&&Object.prototype.hasOwnProperty.call(n,"default")?n.default:n,o=o&&Object.prototype.hasOwnProperty.call(o,"default")?o.default:o;const a={},s=Symbol(),u=Symbol();let l=o,c="production";a.getDeviceRenderMode=function(){return document.body.getAttribute("data-oj-device-render-mode")||a.getDeviceType()},a.getDeviceType=function(){return n.AgentUtils.getAgentInfo().deviceType},a.getLocale=function(){const e=l._ojLocale_;return"root"===e?"en":e},a.setLocale=function(t,o){var r="ojL10n!ojtranslations/nls/",a=r+t+"/ojtranslations";var s=[new Promise(function(t,n){e([a],function(e){t(i(e))},n)}).then(e=>{l=e})];if(n.LocaleData){var u=r+t+"/localeElements";const o=new Promise(function(t,n){e([u],function(e){t(i(e))},n)}).then(e=>{e&&n.LocaleData.__updateBundle(Object.assign({},e.default))});if(s.push(o),n.TimezoneData){var c=n.TimezoneData.__getBundleNames().map(n=>new Promise(function(o,a){e([`${r}${t}${n}`],function(e){o(i(e))},a)}));s.push(Promise.all(c).then(e=>{e.forEach(n.TimezoneData.__mergeIntoLocaleElements)}))}}Promise.all(s).then(()=>{o&&o()})},a.getResourceUrl=function(e){if(null==e||/^\/|:/.test(e))return e;var t=a._resourceBaseUrl;null==t&&(t=a._getOjBaseUrl()||"");var n=t.length;return t+(0===n||"/"===t.charAt(n-1)?"":"/")+e},a.setResourceBaseUrl=function(e){a._resourceBaseUrl=e},a.setAutomationMode=function(e){a._automationMode=e},a.getAutomationMode=function(){return a._automationMode},a.getVersionInfo=function(){var e="Oracle JET Version: "+n.version+"\n";e+="Oracle JET Revision: "+n.revision+"\n";var t="undefined"!=typeof window;return t&&window.navigator&&(e+="Browser: "+window.navigator.userAgent+"\n",e+="Browser Platform: "+window.navigator.platform+"\n"),$&&($.fn&&(e+="jQuery Version: "+$.fn.jquery+"\n"),$.ui&&$.ui.version&&(e+="jQuery UI Version: "+$.ui.version+"\n")),n.ComponentBinding&&(e+="Knockout Version: "+n.ComponentBinding.__getKnockoutVersion()+"\n"),t&&window.require&&(e+="Require Version: "+window.require.version+"\n"),e},a.logVersionInfo=function(){},a._getOjBaseUrl=function(){var t=null;void 0!==e&&e.toUrl&&(t=e.toUrl("ojs/_foo_").replace(/[^/]*$/,"../"));return t},a._getEngineByType=function(t){if(!a[t]){let n;if(t===u)n=new Promise(function(t,n){e(["ojs/ojtemplateengine-preact"],function(e){t(i(e))},n)});else n=new Promise(function(t,n){e(["ojs/ojtemplateengine-ko"],function(e){t(i(e))},n)});a[t]=n.then(e=>e.default)}return a[t]},a.__getTemplateEngine=function(e){let t;const n=r.CustomElementUtils.getElementState(e.customElement);return t="preact"!==n.getBindingProviderType()||e.needsTrackableProperties||n.getUseKoFlag()?a._getEngineByType(s):a._getEngineByType(u),t},a.getConfigBundle=function(){return l},a.getExpressionEvaluator=function(){return a._expressionEvaluator},a.setExpressionEvaluator=function(e){if(a._expressionEvaluator)throw new Error("JET Expression evaluator can't be set more than once.");a._expressionEvaluator=e},a.setDeploymentMode=function(e){if("production"!==e&&"development"!==e)throw new Error("Expected values for deployment mode are 'production' or 'development'.");c=e},a.getDeploymentMode=function(){return c};const g=a.getDeviceRenderMode,f=a.getDeviceType,d=a.getLocale,p=a.setLocale,m=a.getResourceUrl,v=a.setResourceBaseUrl,E=a.setAutomationMode,y=a.getAutomationMode,_=a.getVersionInfo,j=a.logVersionInfo,w=a.setExpressionEvaluator,B=a.getExpressionEvaluator,D=a.getConfigBundle,M=a.__getTemplateEngine,T=a.setDeploymentMode,h=a.getDeploymentMode;t.__getTemplateEngine=M,t.getAutomationMode=y,t.getConfigBundle=D,t.getDeploymentMode=h,t.getDeviceRenderMode=g,t.getDeviceType=f,t.getExpressionEvaluator=B,t.getLocale=d,t.getResourceUrl=m,t.getVersionInfo=_,t.logVersionInfo=j,t.setAutomationMode=E,t.setDeploymentMode=T,t.setExpressionEvaluator=w,t.setLocale=p,t.setResourceBaseUrl=v,Object.defineProperty(t,"__esModule",{value:!0})});
//# sourceMappingURL=ojconfig.js.map;
define('@oracle/oraclejet-preact/matchTranslationBundle-e243f90d',['exports'], (function(n){"use strict";function t(n,t){let l=null;const e=n.split("-");for(;null===l&&e.length>1;){e.pop();const n=e.join("-");t.has(n)&&(l=n)}return l}n.matchTranslationBundle=function(n,l){let e=null;for(let o=0;null===e&&o<n.length;o++){const u=n[o];e=l.has(u)?u:t(u,l)}return e}}));
//# sourceMappingURL=matchTranslationBundle-e243f90d.js.map
;
define('@oracle/oraclejet-preact/utils/UNSAFE_matchTranslationBundle',['exports', '../matchTranslationBundle-e243f90d'], (function(e,n){"use strict";e.matchTranslationBundle=n.matchTranslationBundle,Object.defineProperty(e,"__esModule",{value:!0})}));
//# sourceMappingURL=UNSAFE_matchTranslationBundle.js.map
;
define('@oracle/oraclejet-preact/resources/nls/supportedLocales',['exports'], (function(e){"use strict";e.default=["ar","ar-XB","bg","bs","bs-Cyrl","cs","da","de","el","en","en-XA","en-XC","es","et","fi","fr","fr-CA","he","hr","hu","is","it","ja","ko","lt","lv","ms","nl","no","pl","pt","pt-PT","ro","ru","sk","sl","sr","sr-Latn","sv","th","tr","uk","vi","zh-Hans","zh-Hant"],Object.defineProperty(e,"__esModule",{value:!0})}));
//# sourceMappingURL=supportedLocales.js.map
;
/**
 * @license
 * Copyright (c) 2014, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
define('ojs/ojtranslationbundleutils',["exports","ojs/ojconfig","@oracle/oraclejet-preact/utils/UNSAFE_matchTranslationBundle","@oracle/oraclejet-preact/resources/nls/supportedLocales"],function(e,t,a,r){"use strict";r=r&&Object.prototype.hasOwnProperty.call(r,"default")?r.default:r;const n=new Set(r),l=new Map,o=new Map,s=e=>{let t=o.get(e);return t||(t=l.get(e)(c(e)),o.set(e,t)),t},c=(()=>{let e;return r=>(void 0===e&&(e=a.matchTranslationBundle([t.getLocale()],n)),e)})();e.getTranslationBundlePromise=s,e.loadAllPendingBundles=()=>{const e=Array.from(l.keys(),e=>s(e));return Promise.all(e)},e.matchTranslationBundle=(e,t)=>a.matchTranslationBundle([e],t),e.registerTranslationBundleLoaders=e=>{Object.keys(e).forEach(t=>{l.has(t)||l.set(t,e[t])})},Object.defineProperty(e,"__esModule",{value:!0})});
//# sourceMappingURL=ojtranslationbundleutils.js.map;
define('@oracle/oraclejet-preact/BusyStateContext-ab2c549a',['exports', 'preact'], (function(t,e){"use strict";const n=e.createContext({addBusyState:()=>()=>{}});t.BusyStateContext=n}));
//# sourceMappingURL=BusyStateContext-ab2c549a.js.map
;
define('@oracle/oraclejet-preact/useBusyStateContext-26bb2acb',['exports', 'preact/hooks', './BusyStateContext-ab2c549a'], (function(t,e,n){"use strict";t.useBusyStateContext=function(){return e.useContext(n.BusyStateContext)}}));
//# sourceMappingURL=useBusyStateContext-26bb2acb.js.map
;
define('@oracle/oraclejet-preact/hooks/UNSAFE_useBusyStateContext',['exports', '../BusyStateContext-ab2c549a', '../useBusyStateContext-26bb2acb', 'preact', 'preact/hooks'], (function(t,e,s,u,a){"use strict";t.BusyStateContext=e.BusyStateContext,t.useBusyStateContext=s.useBusyStateContext,Object.defineProperty(t,"__esModule",{value:!0})}));
//# sourceMappingURL=UNSAFE_useBusyStateContext.js.map
;
/**
 * @license
 * Copyright (c) 2014, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
define('ojs/ojvcomponent',["require","exports","preact/compat","preact/jsx-runtime","preact","ojs/ojcustomelement-utils","ojs/ojcustomelement-registry","preact/hooks","@oracle/oraclejet-preact/UNSAFE_Environment","ojs/ojcore-base","ojs/ojpreact-patch","ojs/ojlogger","ojs/ojmetadatautils","@oracle/oraclejet-preact/UNSAFE_Layer","ojs/ojlayerutils","ojs/ojconfig","ojs/ojcontext","ojs/ojtranslationbundleutils","@oracle/oraclejet-preact/hooks/UNSAFE_useBusyStateContext"],function(e,t,o,n,s,r,i,a,l,c,p,u,d,h,_,m,f,y,g){"use strict";c=c&&Object.prototype.hasOwnProperty.call(c,"default")?c.default:c,f=f&&Object.prototype.hasOwnProperty.call(f,"default")?f.default:f;let C,v=0;const b=new Map,P=new Map,E=Symbol(),S="@oj_s";function j(e,t,o,n){const i=function(e){let t=e[E];void 0===t&&(t=S+v++,e[E]=t);return t}(t);let l=0;function c(){l++}function d(){if(l--,l<0)throw new r.JetElementError(e,"Slot reference count underflow");if(0===l)n(t);else{const e=t.parentElement;e&&p.patchSlotParent(e)}}t[p.OJ_SLOT_REMOVE]=()=>null;const h=function(e){e?(c(),p.patchSlotParent(t.parentElement),o(t)):d()};return s.h(()=>(function(e,t,o){let n=b.get(e);const s=0===b.size;n?n.has(t)&&function(e,t){const o=t.nodeType===Node.ELEMENT_NODE?t.getAttribute("slot")??"":"";u.error(`Custom Element "<${e.localName}>" with id "${e.id}" \n  is distributing slot "${o}" more than once`)}(e,o):(n=new Set,b.set(e,n));n.add(t),P.set(t,o),s&&(C=document.createElementNS,document.createElementNS=x)}(e,i,t),c(),a.useLayoutEffect(()=>{!function(e,t){const o=b.get(e);o?.delete(t),0===o?.size&&b.delete(e);0===b.size&&(P.clear(),document.createElementNS=C)}(e,i),d()}),s.h(i,{ref:h,key:i})),null)}function x(e,t,o){return t.startsWith(S)?P.get(t):C.call(document,e,t,o)}class w{parkNode(e){this._getLot().appendChild(e)}disposeNodes(e,t){w._iterateSlots(e,e=>{const o=e.parentElement;this._lot===o?(t(e),this._lot.__removeChild(e)):o||t(e)})}disconnectNodes(e){w._iterateSlots(e,e=>{this._lot===e.parentElement&&this._lot.__removeChild(e)})}reconnectNodes(e){w._iterateSlots(e,e=>{e.parentElement||this._lot.appendChild(e)})}isParked(e){return e?.parentElement===this._lot}_getLot(){if(!this._lot){const e=document.createElement("div");e.__removeChild=e.removeChild,e.removeChild=e=>e,e.style.display="none",document.body.appendChild(e),this._lot=e}return this._lot}static _iterateSlots(e,t){Object.keys(e).forEach(o=>{e[o].forEach(e=>{t(e)})})}}const k=new w,R=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;function O(e,t,o){"-"===t[0]?e.setProperty(t,o):null==o?e[t]="":"number"!=typeof o||R.test(t)?e[t]=o:e[t]=o+"px"}function T(e,t,o,n,s){let r;e:if("style"===t)if("string"==typeof o)e.style.cssText=o;else{if("string"==typeof n&&(e.style.cssText=n=""),n)for(t in n)o&&t in o||O(e.style,t,"");if(o)for(t in o)n&&o[t]===n[t]||O(e.style,t,o[t])}else if("o"===t[0]&&"n"===t[1])if(r=t!==(t=t.replace(/(PointerCapture)$|Capture$/i,"$1")),t=t.toLowerCase()in e||"onFocusOut"===t||"onFocusIn"===t?t.toLowerCase().slice(2):t.slice(2),e._listeners||(e._listeners={}),e._listeners[t+r]=o,o){if(!n){const o=r?M:A;e.addEventListener(t,o,r)}}else{const o=r?M:A;e.removeEventListener(t,o,r)}else if("dangerouslySetInnerHTML"!==t){if(s)t=t.replace(/xlink[H:h]/,"h").replace(/sName$/,"s");else if("width"!=t&&"height"!=t&&"href"!==t&&"list"!==t&&"form"!==t&&"tabIndex"!=t&&"download"!=t&&"rowSpan"!=t&&"colSpan"!=t&&"role"!=t&&"popover"!=t&&t in e)try{e[t]=null==o?"":o;break e}catch(e){}"function"==typeof o||(null==o||!1===o&&"-"!==t[4]?e.removeAttribute(t):e.setAttribute(t,"popover"==t&&1==o?"":o))}}function A(e){this._listeners[e.type+!1](s.options.event?s.options.event(e):e)}function M(e){this._listeners[e.type+!0](s.options.event?s.options.event(e):e)}const N=Symbol(),L=Symbol();class U extends s.Component{constructor(e){super(e),this.getEnvironmentContextObj=(e,t,o,n,s)=>{let r=e;return r?t&&t!==r?(r=t,this.extendTranslationBundleMap(r,s)):(o&&o!==r.colorScheme||n&&n!==r.scale)&&(r=Object.assign({},r,o&&{colorScheme:o},n&&{scale:n})):(r=t||{colorScheme:o,scale:n,user:{locale:m.getLocale()}},this.extendTranslationBundleMap(r,s)),r},this.extendTranslationBundleMap=(e,t)=>{e.translations?e.translations!==t&&Object.keys(t).forEach(o=>{e.translations[o]||(e.translations[o]=t[o])}):e.translations=t},this.state={compProps:e.initialCompProps,renderCount:0,connected:!0},this._layerContext=_.getLayerContext(e.baseElem)}shouldComponentUpdate(e,t){return this.state.renderCount!==t.renderCount||this.state.connected!==t.connected}render(e){if(!this.state.connected)return null;const t=this.state.compProps,o=e.baseComp,s=n.jsx(o,{...t}),r=B(this.getEnvironmentContextObj,[e.baseElem.__oj_private_contexts?.get(l.EnvironmentContext),e.baseElem.__oj_private_color_scheme,e.baseElem.__oj_private_scale,e.translationBundleMap]),i=e.baseElem.__oj_private_contexts,a=i?Array.from(i).reduce((e,[t,o])=>{if(t===l.EnvironmentContext)return e;return n.jsx(t.Provider,{value:o,children:e})},s):s,c=s.props;return c[N]=e.baseElem,c[L]=e.rootPatchCallback,n.jsx(h.LayerContext.Provider,{value:this._layerContext,children:n.jsx(l.RootEnvironmentProvider,{environment:r,children:a})})}}const B=(e,t)=>(e.memoState||(e.memoState={value:void 0,prevArgs:void 0}),D(e.memoState.prevArgs,t)&&(e.memoState.value=e(e.memoState.value,...t),e.memoState.prevArgs=t),e.memoState.value),D=(e,t)=>!e||e.length!==t.length||t.some((t,o)=>t!==e[o]),H=(e,t)=>{if(e){if("function"==typeof e)return e(t);e.current=t}},I=new Set,V=Symbol(),F=Symbol(),$="subproperty",q="propChange";class z{constructor(e,t,o,n,i,a){this.ref=s.createRef(),this._compWithContextsRef=s.createRef(),this._initialized=!1,this._isPatching=!1,this._props={ref:this.ref},this._verifyingState=W.Unset,this._earlySets=[],this._eventQueue=[],this._isRenderQueued=!1,this._state=r.CustomElementUtils.getElementState(e),this._element=e,this._metadata=o,this._component=t,this._controlledProps=i?.length>0?new Set(i):I,this._controlledAttrs=n?.length>0?new Set(n):I,this._defaultProps=a,this._rootPatchCallback=this._patchRootElement.bind(this),this._renderCount=0}connectedCallback(){this._verifyConnectDisconnect(W.Connect)}disconnectedCallback(){this._verifyConnectDisconnect(W.Disconnect)}attributeChangedCallback(e,t,o){if(!this._isPatching&&this._state.canHandleAttributes()){const n=r.AttributeUtils.attributeToPropertyName(e),s=n.split(".")[0];if(this._state.dirtyProps.has(s))this._state.dirtyProps.delete(s);else if(t===o)return;null===o&&(o=void 0),"knockout"===this._state.getBindingProviderType()&&(r.AttributeUtils.isGlobalOrData(n)||this._element.dispatchEvent(new CustomEvent("attribute-changed",{detail:{attribute:e,value:o,previousValue:t}})));const{propPath:i,propValue:a,propMeta:l,subPropMeta:c}=this._getPropValueInfo(e,o);i&&this._updatePropsAndQueueRenderAsNeeded(i,a,l,c)}}getProperty(e){if(d.getPropertyMetadata(e,this._metadata?.properties)){let t=r.CustomElementUtils.getPropertyValue(this._props,e);return void 0===t&&this._defaultProps&&(t=r.CustomElementUtils.getPropertyValue(this._defaultProps,e)),t}return this._element[e]}setProperty(e,t){if(this._isPatching)return;const{prop:o,subProp:n}=d.getComplexPropertyMetadata(e,this._metadata?.properties);o?this._state.allowPropertySets()?(t=r.transformPreactValue(this._element,e,n,t),this._updatePropsAndQueueRenderAsNeeded(e,t,o,n)):this._earlySets.push({property:e,value:t}):this._element[e]=t}setProperties(e){this._isPatching||Object.keys(e).forEach(t=>{this.setProperty(t,e[t])})}getProps(){return this._props}isInitialized(){return!!this._vdom}appendChildHelper(e,t){return r.CustomElementUtils.canRelocateNode(e,t)?HTMLElement.prototype.appendChild.call(e,t):t}insertBeforeHelper(e,t,o){return r.CustomElementUtils.canRelocateNode(e,t)?(o&&o.parentNode!==e&&u.info(`Using insertBefore where ${e.tagName} is not a parent of ${o.tagName}`),o&&o.parentNode?HTMLElement.prototype.insertBefore.call(o.parentNode,t,o):HTMLElement.prototype.insertBefore.call(e,t,o)):t}_render(){if(!this._initialized){this._initialized=!0,this._initializePropsFromDom();const e=this._metadata.events;e&&this._initializeActionCallbacks(e);const t=this._metadata.extension?._WRITEBACK_PROPS;t&&this._initializeWritebackCallbacks(t),this._playbackEarlyPropertySets()}if(this._vdom)throw new Error(`Unexpected render call for already rendered component ${this._element.tagName}`);this._vdom=n.jsx(U,{ref:this._compWithContextsRef,baseComp:this._component,baseElem:this._element,initialCompProps:this._props,rootPatchCallback:this._rootPatchCallback,translationBundleMap:this._state.getTranslationBundleMap()}),s.render(this._vdom,this._element)}_getPropValueInfo(e,t){if("knockout"!==this._state.getBindingProviderType()||!r.AttributeUtils.getExpressionInfo(t).expr){const o=r.AttributeUtils.attributeToPropertyName(e),{prop:n,subProp:s}=d.getComplexPropertyMetadata(o,this._metadata?.properties);if(n)return n.readOnly?{}:{propPath:o,propValue:r.AttributeUtils.attributeToPropertyValue(this._element,e,t,s),propMeta:n,subPropMeta:s};const i=r.AttributeUtils.getGlobalPropForAttr(e);if(this._controlledProps.has(i))return{propPath:i,propValue:this._element[r.AttributeUtils.getGlobalValuePropForAttr(e)]??t}}return{}}_updatePropsAndQueueRenderAsNeeded(e,t,o,n,s=!0){const i=this.getProperty(e),a=void 0===t?r.CustomElementUtils.getPropertyValue(this._defaultProps,e):t;if(o&&r.ElementUtils.comparePropertyValues(o.writeback,a,i))return;const l=e.split("."),p=l[0],u=l.length>1;let d=this.getProperty(p);if(c.CollectionUtils.isPlainObject(d)&&(d=c.CollectionUtils.copyInto({},d,void 0,!0)),s&&this._verifyProps(e,t,o,n),this._updateProps(l,t),!s||this._state.allowPropertyChangedEvents()&&!r.AttributeUtils.isGlobalOrData(e)){this._state.dirtyProps.add(p);const o=s?"external":"internal",n={value:this.getProperty(p),previousValue:d,updatedFrom:o};u&&(n[$]={path:e,value:t,previousValue:i});const r=p+"Changed",a=u?null:e=>{if(e.kind!==q||e.type!==r||e.detail[$])return null;const t=Object.assign({},n,{previousValue:e.detail.previousValue});return{type:r,detail:t,collapse:a,kind:q}};this._queueFireEventsTask({type:r,detail:n,collapse:a,kind:q})}const h=this._oldRootProps;h&&this._controlledProps.has(e)&&(h[e]=t),this._vdom&&!o?.readOnly&&(this._compWithContextsRef?.current?this._queueRender():window.queueMicrotask(()=>{this._queueRender()}))}_queueRender(){if(!this._compWithContextsRef?.current)throw new Error(`Render requested for a disconnected component ${this._element.tagName}`);this._renderCount++,this._compWithContextsRef.current.setState({compProps:this._props,renderCount:this._renderCount})}_verifyProps(e,t,o,n){if(o){if(o.readOnly)throw new r.JetElementError(this._element,`Read-only property '${e}' cannot be set.`);try{d.checkEnumValues(this._element,e,t,n)}catch(e){throw new r.JetElementError(this._element,e.message)}}}_updateProps(e,t){const o=e[0];let n=this._props;if(e.length>1){const e=this._props[o]??this._defaultProps?.[o];e&&c.CollectionUtils.isPlainObject(e)?n[o]=c.CollectionUtils.copyInto({},e,void 0,!0):n[o]={}}for(;e.length;){const o=e.shift();0===e.length?n[o]=t:n[o]||(n[o]={}),n=n[o]}}_queueFireEventsTask(e){let t=e;const o=this._getEventCollapseInfo(e,this._eventQueue);if(o){const[e,n]=o;this._eventQueue.splice(e,1),t=n}return this._eventQueue.push(t),this._queuedEvents||(this._queuedEvents=new Promise(e=>{window.queueMicrotask(()=>{try{for(;this._eventQueue.length;){const e=this._eventQueue.shift(),t=e.kind===q?new CustomEvent(e.type,{detail:e.detail}):e.event;this._element.dispatchEvent(t)}}finally{e(),this._queuedEvents=null}})})),this._queuedEvents}_getEventCollapseInfo(e,t){if(e.kind!==q)return null;for(let o=0;o<t.length;o++){const n=e.collapse?.(t[o]);if(n)return[o,n]}return null}_verifyConnectDisconnect(e){this._state.isComplete()&&this._compWithContextsRef?.current?.setState({connected:e===W.Connect}),this._verifyingState===W.Unset&&window.queueMicrotask(()=>{this._verifyingState===e&&(this._verifyingState===W.Connect?this._verifiedConnect():this._verifiedDisconnect()),this._verifyingState=W.Unset}),this._verifyingState=e}_verifiedConnect(){if(this._state.isComplete())this._reconnectSlots();else if(this._state.startCreationCycle(),this._state.isCreating()){const e=()=>{this._element[r.CHILD_BINDING_PROVIDER]="preact";let e=this._state.getSlotMap();if(e)this._reconnectSlots();else{e=this._state.getSlotMap(!0);const t=this._removeAndConvertSlotsToProps(e);Object.assign(this._props,t)}this._render()};this._state.setCreateCallback(e),this._state.setBindingsDisposedCallback(()=>this._handleBindingsDisposed())}this._state.executeLifecycleCallbacks(!0)}_verifiedDisconnect(){this._state.executeLifecycleCallbacks(!1),this._state.isComplete()?(this._disconnectSlots(),this._state.resetCreationCycle(),s.render(null,this._element),H(this.ref,null),H(this._compWithContextsRef,null),"function"==typeof this._oldRootCleanupCallback&&(this._oldRootCleanupCallback(),this._oldRootCleanupCallback=void 0),H(this._oldRootRef,null),this._oldRootRef=void 0,this._vdom=null):this._state.pauseCreationCycle()}_initializePropsFromDom(){const e=this._element.attributes;for(let t=0;t<e.length;t++){const{name:o,value:n}=e[t],{propPath:s,propValue:r,propMeta:i,subPropMeta:a}=this._getPropValueInfo(o,n);s&&(this._verifyProps(s,r,i,a),this._updateProps(s.split("."),r))}}_playbackEarlyPropertySets(){for(;this._earlySets.length;){const e=this._earlySets.shift(),t=d.getPropertyMetadata(e.property,this._metadata?.properties),o=r.transformPreactValue(this._element,e.property,t,e.value);this.setProperty(e.property,o)}}_patchRootElement(e){const t=this._oldRootProps||this._getInitialRootProps(),o=e.props;this._isPatching=!0;try{!function(e,t,o,n,s,r){let i;for(i in o)"children"===i||"key"===i||i in t||r(e,i,null,o[i],n)||T(e,i,null,o[i],n);for(i in t)s&&"function"!=typeof t[i]||"children"===i||"key"===i||"value"===i||"checked"===i||o[i]===t[i]||r(e,i,t[i],o[i],n)||T(e,i,t[i],o[i],n)}(this._element,o,t,!1,!1,z._setPropertyOverrides)}finally{this._isPatching=!1}const n=e.ref;this._oldRootRef!==n&&("function"==typeof this._oldRootCleanupCallback&&this._oldRootCleanupCallback(),this._oldRootCleanupCallback=H(n,this._element),n&&H(this._oldRootRef,null)),this._oldRootProps=o,this._oldRootRef=n}static _setPropertyOverrides(e,t,o,n){if("style"===t&&"string"==typeof o)throw new Error("CSS style must be an object. CSS text is not supported");if("class"===t||"className"===t){const t=null==n?I:r.CustomElementUtils.getClassSet(n),s=null==o?I:r.CustomElementUtils.getClassSet(o);for(const o of t.values())s.has(o)||e.classList.remove(o);for(const o of s.values())t.has(o)||e.classList.add(o);return!0}if("o"===t[0]&&"n"===t[1]){const s=t!==(t=t.replace(/(PointerCapture)$|Capture$/i,"$1"));t=t.toLowerCase()in e||"onFocusOut"===t||"onFocusIn"===t?t.toLowerCase().slice(2):t.slice(2),z._getRootListeners(e,s)[t]=o;const r=s?z._eventProxyCapture:z._eventProxy;return o?n||e.addEventListener(t,r,s):e.removeEventListener(t,r,s),!0}return"role"===t&&(o?e.setAttribute(t,o):e.removeAttribute(t),!0)}static _getRootListeners(e,t){const o=t?F:V;let n=e[o];return n||(n=e[o]={}),n}_getInitialRootProps(){const e={};for(const t of this._controlledProps.values())t in this._props&&(e[t]=this._props[t]);return e}_removeAndConvertSlotsToProps(e){const t=this._metadata.extension?._DYNAMIC_SLOT,o=t?.prop,n=this._metadata?.slots,s=Object.keys(e),r={};if(s.length>0&&s.forEach(s=>{const i=e[s];i.forEach(e=>{k.parkNode(e),this._propagateSubtreeHidden(e)});const a=d.getPropertyMetadata(s,n);if(a){const e=!!a?.data,t=e||""!==s?s:"children";this._assignSlotProperty(r,t,void 0,s,e,i)}else{if(!o)return;r[o]||(r[o]={});const e=t.isTemplate;this._assignSlotProperty(r,s,o,s,e,i)}}),"knockout"===this._state.getBindingProviderType()){let e;for(;e=this._element.firstChild;)this._state.getBindingProviderCleanNode()(e),e.remove()}return r}_assignSlotProperty(e,t,o,n,s,i){const a=o?e[o]:e;if(s){if("TEMPLATE"!==i[0]?.nodeName)throw new r.JetElementError(this._element,`Slot content for template slot ${n} must be a template element.`);{const e=i[0];let n=e.render;n?(a[t]=n,Object.defineProperties(e,{render:{enumerable:!0,get:()=>n,set:e=>{n=e,e&&(this._updateProps([t],e),this._queueRender())}}})):a[t]=this._getSlotRenderer(e,t,o)}}else{const e=i.map((e,t)=>j(this._element,e,this._handleSlotMount.bind(this),this._handleSlotUnmount.bind(this)));a[t]=e}}_getSlotRenderer(e,t,o){const n=this._state.getBindingProvider(),s=n?()=>{(o?this._props[o]:this._props)[t]=this._getSlotRenderer(e,t,o),this._queueRender()}:null;return t=>{const o=this._state.getTemplateEngine();if(!o)throw new r.JetElementError(this._element,"Unexpected call to render a template slot");return o.execute(this._element,e,t,n,s)}}_handleBindingsDisposed(){k.disposeNodes(this._state.getSlotMap(),this._state.getBindingProviderCleanNode()),this._state.disposeTemplateCache()}_disconnectSlots(){k.disconnectNodes(this._state.getSlotMap())}_reconnectSlots(){k.reconnectNodes(this._state.getSlotMap())}_propagateSubtreeHidden(e){e.nodeType===Node.ELEMENT_NODE&&r.CustomElementUtils.subtreeHidden(e)}_handleSlotUnmount(e){this._state.isPostCreateCallbackOrComplete()&&this._element.isConnected&&(k.parkNode(e),window.queueMicrotask(()=>{k.isParked(e)&&this._propagateSubtreeHidden(e)}))}_handleSlotMount(e){const t=r.CustomElementUtils.subtreeShown;t&&e.nodeType===Node.ELEMENT_NODE&&(e.isConnected?t(e):window.queueMicrotask(()=>t(e)))}static _eventProxy(e){this[V][e.type](s.options.event?s.options.event(e):e)}static _eventProxyCapture(e){this[F][e.type](s.options.event?s.options.event(e):e)}_initializeActionCallbacks(e){Object.keys(e).forEach(t=>{const o=e[t],n=r.AttributeUtils.eventTypeToEventListenerProperty(t);this._props[n]=e=>{const n=Object.assign({},e),s=!!o.cancelable,r=[];s&&(n.accept=e=>{r.push(e)});const i={detail:n,bubbles:!!o.bubbles,cancelable:s},a=new CustomEvent(t,i),l=this._queueFireEventsTask({event:a,kind:"action"});if(s)return l.then(()=>a.defaultPrevented?Promise.reject():Promise.all(r).then(()=>Promise.resolve(),e=>Promise.reject(e)))}})}_initializeWritebackCallbacks(e){e.forEach(e=>{const t=r.AttributeUtils.propertyNameToChangedCallback(e),{prop:o,subProp:n}=d.getComplexPropertyMetadata(e,this._metadata?.properties);this._props[t]=t=>{this._updatePropsAndQueueRenderAsNeeded(e,t,o,n,!1)}})}}var W;!function(e){e[e.Connect=0]="Connect",e[e.Disconnect=1]="Disconnect",e[e.Unset=2]="Unset"}(W||(W={}));const G=o.forwardRef((e,t)=>{let o=e.children;const r=i.getElementRegistration(o.type).cache.contexts,c=[l.EnvironmentContext,...r??[]],p=c.map(e=>{const t=a.useContext(e),n=o.props.__oj_provided_contexts?.get(e);return void 0!==n?n:t}),u=a.useMemo(()=>{const e=new Map;for(let t=0;t<c.length;t++)e.set(c[t],p[t]);return e},p);if(void 0!==o.props.__oj_private_contexts&&o.props.__oj_private_contexts!==u&&(o=s.cloneElement(o).props.children),o.props.__oj_private_contexts=u,t)if(o.ref){const e=o.ref;o.ref=o=>{let n,s;return n=H(e,o),s=H(t,o),i=s,(r=n)||i?()=>{"function"==typeof r&&r(),"function"==typeof i&&i()}:void 0;var r,i}}else o.ref=t;return n.jsx(s.Fragment,{children:o})});G.__ojIsEnvironmentWrapper=!0;const Q=(e,t)=>{if(Object.prototype.hasOwnProperty.call(e,t)){e[r.publicToPrivateName.get(t)]=r.toSymbolizedValue(e[t]),delete e[t]}},J=s.options.vnode;let Y=!1;s.options.vnode=e=>{const t=e.type;if("string"==typeof t&&i.isElementRegistered(t)){const t=e.props;Q(t,"value"),Q(t,"checked")}if("string"==typeof t&&!Y&&i.isVComponent(t)){Y=!0;try{const t=s.cloneElement(e),o=n.jsx(G,{children:t});Object.assign(e,o)}finally{Y=!1}}J?.(e)};const Z=100,K=s.options.requestAnimationFrame;s.options.requestAnimationFrame=function(e){const t=new Promise(o=>{const n=()=>{o(),f.__removePreactPromise(t),e()};if(K)K(n);else{const e=()=>{clearTimeout(t),cancelAnimationFrame(o),setTimeout(n)},t=setTimeout(e,Z),o=requestAnimationFrame(e)}});f.__addPreactPromise(t,"Preact requestAnimationFrame")};const X=s.options;if(X.__m||X._hydrationMismatch){const e=[],t=!X._hydrationMismatch,o=t?X.__r:X._render,n=t?X.__e:X._catchError,s=X.diffed,r=t=>{e[e.length-1]===(t.__c||t._component)&&e.pop()};X._render=X.__r=n=>{const s=t?n.__c:n._component;e.push(s),o&&o(n)},X._hook=X.__h=(t,o,n)=>{const s=e[e.length-1];if(!t||s!==t)throw new Error("Hook can only be invoked from render methods.")},X._catchError=X.__e=(e,t,o,s)=>{r(t),n&&n(e,t,o,s)},X.diffed=e=>{r(e),s&&s(e)}}const ee=new class{constructor(){this.appendChildHelper=(e,t)=>HTMLElement.prototype.appendChild.call(e,t),this.insertBeforeHelper=(e,t,o)=>HTMLElement.prototype.insertBefore.call(e,t,o)}connectedCallback(){}disconnectedCallback(){}attributeChangedCallback(e,t,o){}getProperty(e){}setProperty(e,t){}setProperties(e){}};class te extends HTMLElement{static get observedAttributes(){let e=[];return this.metadata.properties&&(e=e.concat(d.getFlattenedAttributes(this.metadata.properties))),this.rootObservedAttributes&&(e=e.concat(this.rootObservedAttributes)),e}connectedCallback(){this._getHelper().connectedCallback()}disconnectedCallback(){this._helper?.disconnectedCallback()}attributeChangedCallback(e,t,o){this._helper?.attributeChangedCallback(e,t,o)}getProperty(e){return this._getHelper().getProperty(e)}setProperty(e,t){this._getHelper().setProperty(e,t)}setProperties(e){this._getHelper().setProperties(e)}appendChild(e){return this._getHelper().appendChildHelper(this,e)}insertBefore(e,t){return this._getHelper().insertBeforeHelper(this,e,t)}setAttribute(e,t){if("class"===e){const e=r.CustomElementUtils.getClassSet(t);r.CustomElementUtils.getElementState(this).setOuterClasses(e)}else HTMLElement.prototype.setAttribute.call(this,e,t)}removeAttribute(e){"class"===e?this.setAttribute("class",""):HTMLElement.prototype.removeAttribute.call(this,e)}_getHelper(){return this._helper||(this.hasAttribute("data-oj-jsx")?(this.removeAttribute("data-oj-jsx"),this.classList.add("oj-complete"),this._helper=ee):this._helper=new z(this,this.constructor.component,this.constructor.metadata,this.constructor.rootObservedAttributes,this.constructor.rootObservedProperties,this.constructor.defaultProps)),this._helper}}const oe=s.createContext(null);function ne(e,t){return"className"===e||r.AttributeUtils.isGlobalOrData(e)||function(e,t){if(t?.properties?.[e])return!1;const o=e.match(se);if(o){const e=o[1].toLowerCase()+o[2];return!t?.events?.[e]}return!1}(e,t)}const se=/^on(?!.*Changed$)([A-Za-z])([A-Za-z]*)$/;const re=({children:e})=>{const{tagName:t,metadata:o,isElementFirst:s,vcompProps:i,elemRefObj:l}=a.useContext(oe);if(s)return e;const c=Object.keys(i).filter(e=>ne(e,o)).reduce((e,t)=>(e[t]=i[t],e),{}),p=n.jsx("div",{ref:function(e){e&&(e[r.CustomElementUtils.VCOMP_INSTANCE]={props:i}),l.current=e},"data-oj-jsx":"",...c,children:e});return p.type=t,p},ie="class",ae=o.forwardRef((e,t)=>{const{tagName:o,metadata:i,isElementFirst:l,vcompProps:c,observedPropsSet:p,elemRefObj:u}=a.useContext(oe);if(l){const r=n.jsx("div",{...e,ref:t});return r.type=o,c[L](r),n.jsx(s.Fragment,{children:e.children})}const d={};c.style&&e.style&&(d.style=Object.assign({},c.style,e.style));const h=c[ie];if(h){const t=e[ie]||"";d[ie]=`${h} ${t}`}const _=Object.keys(c).filter(t=>!(t in e)&&!p.has(t)&&ne(t,i)).reduce((e,t)=>(e[t]=c[t],e),{}),m=n.jsx("div",{...e,...d,..._,ref:e=>{let o;return t&&(o=H(t,e)),e&&(e[r.CustomElementUtils.VCOMP_INSTANCE]={props:c}),u.current=e,o},"data-oj-jsx":""});return m.type=o,m});class le extends r.LifecycleElementState{constructor(e){super(e),this._translationBundleMap={}}getTranslationBundleMap(){return this._translationBundleMap}getTemplateEngine(){return le._cachedTemplateEngine}getTrackChildrenOption(){return"immediate"}allowPropertyChangedEvents(){return super.allowPropertyChangedEvents()&&(e=>{const t=e._getHelper();return!!t.isInitialized?.()})(this.Element)}allowPropertySets(){return this._allowPropertySets||super.allowPropertySets()}resetCreationCycle(){this._allowPropertySets=super.allowPropertySets(),super.resetCreationCycle()}disposeTemplateCache(){const e=this.getSlotMap(),t=Object.keys(e),o=i.getElementDescriptor(this.Element.tagName).metadata,n=o?.extension?._DYNAMIC_SLOT,s=!!n?.isTemplate;t.filter(e=>{const t=d.getPropertyMetadata(e,o?.slots);if(t){if(t.data)return!0}else if(s)return!0;return!1}).forEach(t=>{const o=e[t];"TEMPLATE"===o[0]?.nodeName&&this.getTemplateEngine().cleanupTemplateCache(o[0])})}GetPreCreatedPromise(){let e,t;return this.Element.constructor.translationBundleMap&&(e=this._getTranslationBundlesPromise()),!le._cachedTemplateEngine&&this._hasDirectTemplateChildren()&&(t=this._getTemplateEnginePromise()),Promise.all([e,t]).then(()=>this.Element.isConnected?super.GetPreCreatedPromise():Promise.reject(r.ElementState._DISCONNECTED))}IsTransferAttribute(e){return this.Element.constructor.rootObservedAttrSet.has(e)}GetDescriptiveTransferAttributeValue(e){return((e,t)=>{const o=e.getAttribute(t);if(o)return o;const n=e._getHelper();return(n.getProps?.()||{})[t]})(this.Element,e)}_getTranslationBundlesPromise(){const e=this.Element.constructor.translationBundleMap,t=Object.keys(e),o=[];return t.forEach(e=>{o.push(y.getTranslationBundlePromise(e))}),Promise.all(o).then(e=>{t.forEach((t,o)=>{this._translationBundleMap[t]=e[o]})})}_getTemplateEnginePromise(){return new Promise(function(t,o){e(["ojs/ojvcomponent-template"],function(e){t(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(o){var n=Object.getOwnPropertyDescriptor(e,o);Object.defineProperty(t,o,n.get?n:{enumerable:!0,get:function(){return e[o]}})}),t.default=e,t}(e))},o)}).then(e=>{le._cachedTemplateEngine=e})}_hasDirectTemplateChildren(){const e=this.Element.childNodes;for(let t=0;t<e.length;t++){if("template"===e[t].localName)return!0}return!1}}function ce({elemRefObj:e,children:t}){const o=a.useCallback(t=>{if(e.current){const o=`${e.current.tagName.toLowerCase()}: `;return f.getContext(e.current).getBusyContext().addBusyState({description:`${o}${t}`})}throw new Error("Cannot call addBusyState() when the component is not connected to the DOM. Ensure the component is mounted before attempting to add a busy state.")},[e]),s=a.useMemo(()=>({addBusyState:o}),[o]);return n.jsx(g.BusyStateContext.Provider,{value:s,children:t})}const pe=Symbol("functional component"),ue=Symbol();function de(e){return function(t){const o=t._metadata||t.metadata||{};!function(e){e.properties||(e.properties={});e.properties.__oj_private_color_scheme={type:"string",binding:{consume:{name:"colorScheme"}}},e.properties.__oj_private_scale={type:"string",binding:{consume:{name:"scale"}}},e.properties.__oj_private_contexts={type:"object"},e.properties.__oj_provided_contexts={type:"object"},e.properties.__oj_private_identifier_to_prop={type:"object",writeback:!0},e.properties.__oj_private_identifier_to_value={type:"object",writeback:!0}}(o);const s=o?.extension?._OBSERVED_GLOBAL_PROPS||[],a=s.map(e=>r.AttributeUtils.getGlobalAttrForProp(e));!function(e,t,o,s){const i=t.prototype.render;t.prototype.render=function(t,a,l){const c=o?.extension?._READ_ONLY_PROPS;c&&c.forEach(e=>delete t[e]);const p=t[N],u=!!p;u&&r.CustomElementUtils.getElementState(p).disposeTemplateCache();let d=t;if(t[N]){const{[N]:e,[L]:o,...n}=t;d=n}return this[ue]=this[ue]||{current:t[N]},n.jsx(oe.Provider,{value:{tagName:e,metadata:o,isElementFirst:u,vcompProps:t,observedPropsSet:s,elemRefObj:this[ue]},children:n.jsx(ce,{elemRefObj:this[ue],children:n.jsx(he,{instance:this,baseRender:i,props:d,state:a,context:l,tagName:e,metadata:o})})})}}(e,t,o,new Set(s)),function(e,t,o,n,s,a){a&&y.registerTranslationBundleLoaders(a);class l extends te{}l.metadata=t,l.component=o,l.rootObservedAttributes=s,l.rootObservedAttrSet=new Set(s),l.rootObservedProperties=n,l.defaultProps=o.defaultProps||o._defaultProps?d.deepFreeze(o.defaultProps||o._defaultProps):null,l.translationBundleMap=a,function(e,t){if(!t)return;for(let o in t)Object.defineProperty(e,o,{get(){return this.getProperty(o)},set(e){this.setProperty(o,e)}}),r.addPrivatePropGetterSetters(e,o)}(l.prototype,t?.properties),function(e,t){if(!t)return;for(let o in t)e[o]=function(){if(this._helper===ee)throw new r.JetElementError(this,"Cannot access element methods when rendered as a value based element.");const e=this._helper.ref.current;if(!e)throw new r.JetElementError(this,"Cannot access methods before element is upgraded.");return e[o].apply(e,arguments)}}(l.prototype,t?.methods),i.registerElement(e,{descriptor:{metadata:t},stateClass:le,vcomp:!0,cache:{contexts:o._consumedContexts}},l)}(e,o,t,s,a,t._translationBundleMap||t.translationBundleMap),!t._metadata&&t.metadata&&u.warn(`Component ${e} is compiled with JET version prior to 14.0.0`)}}const he=({instance:e,tagName:t,metadata:r,baseRender:i,props:a,state:l,context:c})=>{let p=i.call(e,a,l,c);if(p?.type?.__ojIsEnvironmentWrapper&&p.props.children.type===t){const e=p.props.children;e.type=ae;try{p=s.cloneElement(e)}finally{e.type=t}}const u=p?.type;return u!==ae&&(_e(u)===(me||(me=_e(o.forwardRef(()=>null))),me)&&u[pe]&&0!==Object.keys(r.methods||{}).length||(p=n.jsx(re,{children:p}))),p};function _e(e){return e?.$$typeof}let me;"undefined"!=typeof window&&(HTMLTemplateElement.prototype.hasOwnProperty("render")||Object.defineProperty(HTMLTemplateElement.prototype,"render",{value:null,writable:!0}));const fe=s.createContext(null),ye=r.ElementUtils.getUniqueId.bind(null,null);t.ReportBusyContext=fe,t.Root=ae,t.consumedContexts=function(e){return function(e){}},t.customElement=de,t.getUniqueId=ye,t.method=function(e,t,o){},t.registerCustomElement=function(e,t,r){class i extends s.Component{constructor(){if(super(),this.__refCallback=e=>{this.__vcompRef&&(this.__vcompRef.current=e);const t=this.props.innerRef;return H(t,e)},i._metadata?.methods){this.__vcompRef=s.createRef();const e=i._metadata.methods,t=this;for(let o in e)t[o]=(...e)=>this.__vcompRef.current?.[o].apply(this.__vcompRef.current,e)}}render(){return arguments[0].ref=this.__refCallback,t(arguments[0])}}return i.displayName=arguments[2],arguments.length>=4&&arguments[3]&&(i._metadata=arguments[3],arguments.length>=5&&arguments[4]&&(i._defaultProps=arguments[4])),arguments.length>=6&&(i._translationBundleMap=arguments[5]),arguments.length>=7&&(i._consumedContexts=arguments[6].consume),i[pe]=!0,de(e)(i),o.forwardRef((e,t)=>n.jsx(i,{...e,innerRef:t}))},Object.defineProperty(t,"__esModule",{value:!0})});
//# sourceMappingURL=ojvcomponent.js.map;
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define('components/app',["require", "exports", "preact/jsx-runtime", "ojs/ojvcomponent", "preact/hooks", "ojs/ojcontext"], function (require, exports, jsx_runtime_1, ojvcomponent_1, hooks_1, Context) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.App = void 0;
    const PRODUCT_GENERIC_GUIDANCE = "Keep the RCA specific to the selected Jira/BugDB ticket, its exact symptom, and the selected Oracle Restaurants product. Do not drift into generic product guidance.";
    const DEFAULT_LOCAL_AGENT_BASE_URL = "http://127.0.0.1:3210";
    const LOCAL_AGENT_RECONNECT_MS = 3000;
    const LOCAL_AGENT_DISCONNECTED_NOTICE = "Local client agent is not connected. Start the local client agent to use Developer mode.";
    const EMPTY_LOCAL_AGENT_STATUS = {
        connected: false,
        host: "",
        port: 0,
        serverMode: "",
        elevated: false,
        requireElevatedExecution: false,
        transport: "none"
    };
    const FALLBACK_PRODUCTS = [
        { key: "simphony", label: "Simphony", family: "Oracle Restaurants Simphony", defaultWorkspace: "C:\\Code\\simphony" },
        { key: "rna", label: "RNA", family: "Oracle Restaurants Reporting and Analytics", defaultWorkspace: "C:\\Code\\rna" },
        { key: "flm", label: "FLM", family: "Oracle Restaurants Front Line Manager", defaultWorkspace: "C:\\Code\\flm" },
        { key: "cnc", label: "C&C", family: "Oracle Restaurants C&C", defaultWorkspace: "C:\\Code\\cnc" }
    ];
    const DEFAULT_CHAT = [
        {
            id: "welcome",
            role: "assistant",
            text: "Start with a Jira number or pasted problem statement. I will keep the run focused and put the full details in Advanced Analysis when the RCA is ready.",
            time: "Now"
        }
    ];
    const RCA_RESULT_SECTION_NAMES = [
        "Subsystem",
        "Investigation Tier",
        "Culprit",
        "Call Chain",
        "Root Cause Code",
        "Code Evidence",
        "Log Evidence",
        "Why It Fails",
        "Complete Fix",
        "Fix Explanation",
        "Proposed Diff",
        "All Affected Files",
        "Confidence",
        "Remaining Uncertainty"
    ];
    const NON_RCA_FINAL_SECTION_NAMES = [
        "Plan",
        "MCP Calls",
        "Result Summary",
        "Verification Loop",
        "UI Validation",
        "Step-by-Step Solution",
        "Comments",
        "Comment Evidence",
        "Audit History",
        "Attachment Evidence",
        "Attachments",
        "Reproducible Evidence"
    ];
    const RCA_RESULT_DISPLAY_SECTION_NAMES = [
        "Summary",
        "Observed vs Expected",
        "Repro Sufficiency",
        "Evidence",
        "Root Cause",
        "Root Cause Code",
        "Code Evidence",
        "Proposed Diff",
        "Proposed Solution",
        "Confidence",
        "Remaining Uncertainty",
        "Recommended Fix",
        "Fix Explanation",
        "Files to update",
        ...RCA_RESULT_SECTION_NAMES
    ];
    const ADVANCED_RCA_FIELD_ORDER = [
        "Comments",
        "Comment Evidence",
        "Audit History",
        "Attachment Evidence",
        "Attachments",
        "Reproducible Evidence",
        "Subsystem",
        "Investigation Tier",
        "Culprit",
        "Call Chain",
        "Log Evidence",
        "Complete Fix",
        "Fix Explanation",
        "Proposed Diff",
        "All Affected Files",
        "Confidence",
        "Remaining Uncertainty"
    ];
    function formatClock() {
        return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    function normalizeText(value) {
        return String(value || "").trim();
    }
    function compactText(value, limit = 220) {
        const normalized = normalizeText(value).replace(/\s+/g, " ");
        return normalized.length > limit ? `${normalized.slice(0, limit - 1)}...` : normalized;
    }
    function formatErrorMessage(value) {
        const raw = value instanceof Error ? value.message : String(value || "");
        const normalized = raw.trim();
        if (!normalized) {
            return "The request failed. Please try again.";
        }
        try {
            const parsed = JSON.parse(normalized);
            const jiraMessages = [
                ...(Array.isArray(parsed.errorMessages) ? parsed.errorMessages : []),
                ...(parsed.errors && typeof parsed.errors === "object" ? Object.values(parsed.errors) : [])
            ].map((entry) => String(entry || "").trim()).filter(Boolean);
            if (jiraMessages.some((message) => /issue does not exist|issue not found/i.test(message))) {
                return "Jira issue was not found. Check the Jira number and confirm you have access to it.";
            }
            if (jiraMessages.length) {
                return jiraMessages.join(" ");
            }
            const message = parsed.error || parsed.message || parsed.detail || parsed.errorMessage;
            if (message) {
                return formatErrorMessage(message);
            }
        }
        catch (_a) {
        }
        const jsonStart = normalized.indexOf("{");
        if (jsonStart > 0 && normalized.endsWith("}")) {
            const prefix = normalized.slice(0, jsonStart).trimEnd();
            const formatted = formatErrorMessage(normalized.slice(jsonStart));
            if (formatted && formatted !== normalized.slice(jsonStart)) {
                if (/HTTP\s+404/i.test(prefix) && /jira issue was not found|issue does not exist|issue not found/i.test(formatted)) {
                    const issueMatch = prefix.match(/Jira issue\s+([A-Za-z0-9_-]+)/i);
                    const issueLabel = (issueMatch === null || issueMatch === void 0 ? void 0 : issueMatch[1]) ? ` ${issueMatch[1]}` : "";
                    return `Jira issue${issueLabel} was not found. Check the Jira number and confirm you have access to it.`;
                }
                return `${prefix} ${formatted}`.trim();
            }
        }
        return normalized
            .replace(/\s+/g, " ")
            .replace(/^Error:\s*/i, "")
            .trim();
    }
    function fetchJson(url_1) {
        return __awaiter(this, arguments, void 0, function* (url, options = {}) {
            const response = yield fetch(url, Object.assign(Object.assign({}, options), { headers: Object.assign({ Accept: "application/json" }, (options.headers || {})) }));
            const body = yield response.text();
            if (!response.ok) {
                throw new Error(formatErrorMessage(body || `HTTP ${response.status}`));
            }
            return body ? JSON.parse(body) : {};
        });
    }
    function normalizeProducts(products) {
        const merged = [...products];
        for (const fallback of FALLBACK_PRODUCTS) {
            const existing = merged.find((product) => product.key === fallback.key || product.label.toLowerCase() === fallback.label.toLowerCase());
            if (!existing) {
                merged.push(fallback);
            }
        }
        return merged.map((product) => {
            const fallback = FALLBACK_PRODUCTS.find((item) => item.key === product.key || item.label.toLowerCase() === product.label.toLowerCase());
            if ((fallback === null || fallback === void 0 ? void 0 : fallback.defaultWorkspace) && (!product.defaultWorkspace || product.defaultWorkspace.toLowerCase().startsWith("shared://"))) {
                return Object.assign(Object.assign({}, product), { defaultWorkspace: fallback.defaultWorkspace });
            }
            return (fallback === null || fallback === void 0 ? void 0 : fallback.defaultWorkspace) && !product.defaultWorkspace
                ? Object.assign(Object.assign({}, product), { defaultWorkspace: fallback.defaultWorkspace }) : product;
        });
    }
    function parseSseBlock(block) {
        const lines = block.split(/\r?\n/);
        let eventName = "message";
        const dataLines = [];
        for (const line of lines) {
            if (line.startsWith("event:")) {
                eventName = line.slice(6).trim();
            }
            else if (line.startsWith("data:")) {
                dataLines.push(line.slice(5).trim());
            }
        }
        if (!dataLines.length) {
            return null;
        }
        try {
            return { eventName, payload: JSON.parse(dataLines.join("\n")) };
        }
        catch (error) {
            return { eventName, payload: { text: dataLines.join("\n") } };
        }
    }
    function firstPresent(...values) {
        for (const value of values) {
            const normalized = normalizeText(value);
            if (normalized) {
                return normalized;
            }
        }
        return "";
    }
    function normalizeSectionName(value) {
        return value
            .replace(/^#{1,6}\s+/, "")
            .replace(/^\*\*|\*\*$/g, "")
            .replace(/:$/, "")
            .replace(/\s*\(confidence:[^)]+\)\s*$/i, "")
            .trim()
            .toLowerCase();
    }
    function getMarkdownHeading(line) {
        const normalized = line.trim();
        const markdown = normalized.match(/^#{1,6}\s+(.+?)\s*$/);
        if (markdown) {
            return stripMarkdownHeading(markdown[1]);
        }
        const bold = normalized.match(/^\*\*(.+?)\*\*:?\s*$/);
        if (bold) {
            return stripMarkdownHeading(bold[1]);
        }
        if (isRichHeading(normalized)) {
            return stripMarkdownHeading(normalized);
        }
        return "";
    }
    function parseFinalMessageSections(value) {
        const sectionMap = {};
        const lines = String(value || "").replace(/\r\n/g, "\n").split("\n");
        let activeHeading = "";
        let activeLines = [];
        function flush() {
            if (!activeHeading) {
                activeLines = [];
                return;
            }
            const body = activeLines.join("\n").trim();
            if (body) {
                sectionMap[normalizeSectionName(activeHeading)] = body;
            }
            activeLines = [];
        }
        for (const line of lines) {
            const boldWithInlineValue = line.trim().match(/^\*\*(.+?)\*\*:?\s*(.*)$/);
            if (boldWithInlineValue && RCA_RESULT_SECTION_NAMES.some((name) => normalizeSectionName(name) === normalizeSectionName(boldWithInlineValue[1]))) {
                flush();
                activeHeading = boldWithInlineValue[1];
                activeLines = boldWithInlineValue[2] ? [boldWithInlineValue[2]] : [];
                continue;
            }
            const heading = getMarkdownHeading(line);
            if (heading && RCA_RESULT_SECTION_NAMES.some((name) => normalizeSectionName(name) === normalizeSectionName(heading))) {
                flush();
                activeHeading = heading;
                continue;
            }
            if (heading && (/^#{1,6}\s+/.test(line.trim())
                || NON_RCA_FINAL_SECTION_NAMES.some((name) => normalizeSectionName(name) === normalizeSectionName(heading)))) {
                flush();
                activeHeading = "";
                continue;
            }
            if (activeHeading) {
                activeLines.push(line);
            }
        }
        flush();
        return sectionMap;
    }
    function pickFinalSection(sectionMap, ...names) {
        for (const name of names) {
            const exact = sectionMap[normalizeSectionName(name)];
            if (exact) {
                return exact;
            }
        }
        return "";
    }
    function cleanRcaField(value) {
        return String(value || "")
            .replace(/\r\n/g, "\n")
            .split("\n")
            .filter((line) => line.trim() !== "---")
            .join("\n")
            .trim();
    }
    function cleanRcaContentLine(line) {
        return line
            .replace(/^\s*[-*]\s+/, "")
            .replace(/^\s*\d+[\).]\s+/, "")
            .trim();
    }
    function isKnownRcaHeading(value) {
        const normalized = normalizeSectionName(value);
        return [
            "summary",
            "observed vs expected",
            "repro sufficiency",
            "evidence",
            "root cause",
            "recommended fix",
            "fix explanation",
            "files to update",
            "proposed solution",
            ...RCA_RESULT_SECTION_NAMES,
            ...NON_RCA_FINAL_SECTION_NAMES
        ].some((name) => normalizeSectionName(name) === normalized);
    }
    function meaningfulRcaLines(value, maxLines = 4) {
        const lines = [];
        for (const rawLine of String(value || "").replace(/\r\n/g, "\n").split("\n")) {
            const line = cleanRcaContentLine(rawLine);
            if (!line || /^```/.test(line) || isKnownRcaHeading(line.replace(/:$/, ""))) {
                continue;
            }
            if (/^(none|n\/a|not available|not provided)$/i.test(line)) {
                continue;
            }
            lines.push(line);
            if (lines.length >= maxLines) {
                break;
            }
        }
        return lines;
    }
    function firstMeaningfulRcaLine(value) {
        return meaningfulRcaLines(value, 1)[0] || "";
    }
    function extractConfidenceLevel(value) {
        const text = cleanRcaField(value);
        const normalized = text.toLowerCase();
        if (/\bmedium\s*[- ]\s*high\b/.test(normalized)) {
            return "Medium-high";
        }
        if (/\bhigh\b/.test(normalized)) {
            return "High";
        }
        if (/\bmedium\b/.test(normalized)) {
            return "Medium";
        }
        if (/\blow\b/.test(normalized)) {
            return "Low";
        }
        const fallback = firstMeaningfulRcaLine(text) || text;
        return fallback.replace(/[.:;,\s]+$/g, "");
    }
    function isPositiveConfidenceLevel(value) {
        return /^(high|medium-high)$/i.test(String(value || "").trim());
    }
    function uniqueRcaLines(lines) {
        const seen = new Set();
        const result = [];
        for (const line of lines.map((item) => cleanRcaContentLine(item)).filter(Boolean)) {
            const key = line.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                result.push(line);
            }
        }
        return result;
    }
    function extractLabeledRcaValue(value, labelPattern) {
        for (const rawLine of String(value || "").replace(/\r\n/g, "\n").split("\n")) {
            const line = cleanRcaContentLine(rawLine);
            const match = line.match(/^([^:]+):\s*(.+)$/);
            if (match && labelPattern.test(match[1].trim())) {
                return cleanRcaContentLine(match[2]);
            }
        }
        return "";
    }
    function extractRcaLinesAfterLabel(value, labelPattern, maxLines = 3) {
        const lines = [];
        let active = false;
        for (const rawLine of String(value || "").replace(/\r\n/g, "\n").split("\n")) {
            const line = cleanRcaContentLine(rawLine);
            if (!line || /^```/.test(line)) {
                if (active && lines.length) {
                    break;
                }
                continue;
            }
            const inline = line.match(/^([^:]+):\s*(.*)$/);
            const label = inline ? inline[1].trim() : line.replace(/:$/, "").trim();
            if (labelPattern.test(label)) {
                active = true;
                if (inline === null || inline === void 0 ? void 0 : inline[2]) {
                    lines.push(cleanRcaContentLine(inline[2]));
                }
                continue;
            }
            if (!active) {
                continue;
            }
            if (/^(symptom|observed|expected|proposed|most likely|evidence|files involved|call path|confidence|remaining uncertainty|recommended fix|fix explanation)\b/i.test(line) || isKnownRcaHeading(line.replace(/:$/, ""))) {
                break;
            }
            lines.push(line);
            if (lines.length >= maxLines) {
                break;
            }
        }
        return uniqueRcaLines(lines).slice(0, maxLines);
    }
    function formatNumberedRcaLines(lines) {
        return uniqueRcaLines(lines)
            .map((line, index) => `${index + 1}) ${line}`)
            .join("\n");
    }
    function trimRcaBlock(value, maxLines = 70, maxChars = 6000) {
        const text = cleanRcaField(value);
        const lines = text.split("\n");
        const clippedByLines = lines.length > maxLines
            ? `${lines.slice(0, maxLines).join("\n")}\n... ${lines.length - maxLines} more lines in Advanced Analysis.`
            : text;
        return clippedByLines.length > maxChars
            ? `${clippedByLines.slice(0, maxChars - 4).trim()} ...`
            : clippedByLines;
    }
    function stripWrappingFence(value) {
        const text = cleanRcaField(value);
        const match = text.match(/^```[a-zA-Z0-9_-]*\n([\s\S]*?)\n```$/);
        return match ? match[1].trim() : text;
    }
    function buildSummaryBlock(resultSummary, whyItFails, culprit, completeFix, fixExplanation) {
        const symptom = firstPresent(extractLabeledRcaValue(resultSummary, /^symptom$/i), firstMeaningfulRcaLine(resultSummary), firstMeaningfulRcaLine(whyItFails), firstMeaningfulRcaLine(culprit));
        const summaryRootCauses = extractRcaLinesAfterLabel(resultSummary, /^root causes?\b/i, 3);
        const rootCauseLines = summaryRootCauses.length
            ? summaryRootCauses
            : uniqueRcaLines([
                ...meaningfulRcaLines(whyItFails, 3),
                ...meaningfulRcaLines(culprit, 1)
            ]).slice(0, 3);
        const nextFix = firstPresent(extractLabeledRcaValue(resultSummary, /^(proposed next fix step|most likely next fix step)\b/i), firstMeaningfulRcaLine(completeFix), firstMeaningfulRcaLine(fixExplanation));
        return [
            symptom ? `- Symptom: ${compactText(symptom, 440)}` : "",
            rootCauseLines.length ? `- Root causes\n${formatNumberedRcaLines(rootCauseLines)}` : "",
            nextFix ? `- Most likely next fix step: ${compactText(nextFix, 380)}` : ""
        ].filter(Boolean).join("\n\n");
    }
    function buildObservedExpected(summary, logEvidence, culprit, whyItFails) {
        const observed = firstPresent(extractLabeledRcaValue(summary, /^symptom$/i), firstMeaningfulRcaLine(summary), firstMeaningfulRcaLine(logEvidence), firstMeaningfulRcaLine(culprit), firstMeaningfulRcaLine(whyItFails));
        if (!observed) {
            return "";
        }
        return [
            `Observed: ${compactText(observed, 520)}`,
            "Expected: The ticket flow should complete without the reported failure; exact product expectation should match the Jira/BugDB acceptance context."
        ].join("\n");
    }
    function buildReproSufficiency(reproEvidence, logEvidence, rootCauseCode, confidence, uncertainty) {
        if (reproEvidence) {
            return reproEvidence;
        }
        const hasDirectEvidence = Boolean(logEvidence || rootCauseCode);
        const isHighConfidence = /^high\b/i.test(confidence.trim());
        if (hasDirectEvidence && isHighConfidence && !uncertainty) {
            return "Sufficient. The available logs/code evidence identify a concrete failing path and support the RCA without needing more reproduction data.";
        }
        if (hasDirectEvidence) {
            return "Partially sufficient. The RCA has concrete evidence, but reproduction details should still be confirmed against the source ticket or attached logs.";
        }
        return uncertainty || "Not fully established from the available output. Add reproducible steps, logs, or a failing scenario to strengthen the RCA.";
    }
    function buildEvidenceBlock(culprit, callChain, logEvidence, affectedFiles) {
        return [
            culprit ? `Issue location:\n${culprit}` : "",
            affectedFiles ? `Files involved:\n${affectedFiles}` : "",
            callChain ? `Call path:\n${callChain}` : "",
            `Log/source evidence:\n${logEvidence || "None provided in Jira/source output."}`
        ].filter(Boolean).join("\n\n");
    }
    function ensureFencedBlock(value, language = "") {
        const text = String(value || "").trim();
        if (!text) {
            return "";
        }
        if (/^```/.test(text)) {
            return text;
        }
        const fence = language ? `\`\`\`${language}` : "```";
        return `${fence}\n${text}\n\`\`\``;
    }
    function buildRootCauseBlock(whyItFails, culprit, resultSummary) {
        const rootCauseLines = uniqueRcaLines([
            ...meaningfulRcaLines(whyItFails, 5),
            ...extractRcaLinesAfterLabel(resultSummary, /^root causes?\b/i, 3),
            ...meaningfulRcaLines(culprit, 2)
        ]).slice(0, 6);
        return rootCauseLines.length
            ? rootCauseLines.map((line) => `- ${line}`).join("\n")
            : "";
    }
    function buildCodeEvidenceBlock(rootCauseCode, codeEvidence) {
        return [
            rootCauseCode ? `Code involved in the root cause\n${trimRcaBlock(rootCauseCode, 30, 2800)}` : "",
            codeEvidence ? trimRcaBlock(codeEvidence, 55, 5200) : ""
        ].filter(Boolean).join("\n\n");
    }
    function buildRootCauseWithCodeBlock(rootCause, rootCauseCode, codeEvidence) {
        return [
            rootCause,
            buildCodeEvidenceBlock(rootCauseCode, codeEvidence)
        ].filter(Boolean).join("\n\n");
    }
    function buildAdvancedRootCauseBlock(whyItFails, rootCauseCode, codeEvidence) {
        return [
            cleanRcaField(whyItFails),
            rootCauseCode ? `Code involved in the root cause\n${cleanRcaField(rootCauseCode)}` : "",
            codeEvidence ? stripWrappingFence(codeEvidence) : ""
        ].filter(Boolean).join("\n\n");
    }
    function buildRecommendedFix(completeFix, fixExplanation) {
        return cleanRcaField(completeFix) || (firstMeaningfulRcaLine(fixExplanation) ? `- ${firstMeaningfulRcaLine(fixExplanation)}` : "");
    }
    function buildProposedDiffBlock(proposedDiff) {
        const text = stripWrappingFence(proposedDiff)
            .replace(/^-?\s*Note:\s*Proposed only;.*$/gim, "")
            .trim();
        if (!text) {
            return "- Note: Proposed diff was not returned by Codex for this RCA. Re-run with more concrete source evidence if a code patch is required.";
        }
        const diffBody = trimRcaBlock(text, 140, 9000);
        return [
            "- Note: Proposed only; not applied or verified in this RCA-only run.",
            diffBody.includes("```") ? diffBody : ensureFencedBlock(diffBody, "diff")
        ].join("\n");
    }
    function buildAdvancedProposedDiffBlock(proposedDiff) {
        const text = stripWrappingFence(proposedDiff)
            .replace(/^-?\s*Note:\s*Proposed only;.*$/gim, "")
            .replace(/^```diff\s*$/gim, "")
            .replace(/^```\s*$/gim, "")
            .trim();
        if (!text) {
            return "- Note: Proposed diff was not returned by Codex for this RCA. Re-run with more concrete source evidence if a code patch is required.";
        }
        return [
            "- Note: Proposed only; not applied or verified in this RCA-only run.",
            "",
            ensureFencedBlock(trimRcaBlock(text, 220, 14000), "diff")
        ].join("\n");
    }
    function filterAttachmentDisplayText(value) {
        return cleanRcaField(value)
            .split("\n")
            .map((line) => line.trimEnd())
            .filter((line) => {
            const normalized = line.trim();
            if (!normalized) {
                return true;
            }
            return !/\b[\w .()_-]+\.(?:bmp|gif|jpe?g|png|svg|webp)\b/i.test(normalized)
                && !/\b(?:content was not included|was not fetched|not fetched|not included in the prompt|not included in prompt)\b/i.test(normalized)
                && !/\b(?:ignored|skipped)\b.*\b(?:image|screenshot|video|media)\b/i.test(normalized)
                && !/\b(?:image-only|screenshot-only|video-only|media-only)\b/i.test(normalized)
                && !/\b(?:no|none|not)\b.*\b(?:attachment evidence|attachments?)\b.*\b(?:available|provided|included|fetched|present)\b/i.test(normalized);
        })
            .join("\n")
            .trim();
    }
    function normalizeDisplayedSectionBody(heading, body) {
        const normalizedHeading = normalizeSectionName(heading);
        if (normalizedHeading === "attachment evidence" || normalizedHeading === "attachments") {
            return filterAttachmentDisplayText(body);
        }
        return body.trim();
    }
    function pickAdvancedSection(sections, finalSections, name) {
        return cleanRcaField(firstPresent(sections[name], pickFinalSection(finalSections, name)));
    }
    function buildDefaultAdvancedPlan(payload) {
        var _a;
        const request = ((_a = payload === null || payload === void 0 ? void 0 : payload.session) === null || _a === void 0 ? void 0 : _a.request) || {};
        const product = cleanRcaField(request.product || request.productLabel || (payload === null || payload === void 0 ? void 0 : payload.productLabel) || "selected product");
        const ticket = cleanRcaField(request.ticketId || (payload === null || payload === void 0 ? void 0 : payload.ticketId) || "");
        const ticketLabel = ticket ? `Jira ${ticket}` : request.ticketSource === "description" ? "provided problem statement" : "ticket evidence";
        return [
            `- Select ${product} relevant code paths`,
            `- Anchor analysis to ${ticketLabel} evidence only`,
            "- Map call chain and isolate root cause(s)",
            "- Propose next-step fix scope (no edits/builds in RCA-only)"
        ].join("\n");
    }
    function buildDefaultAdvancedMcpCalls() {
        return "- None. Used prefetched Jira/problem evidence; no live Jira/automation invoked.";
    }
    function buildAdvancedResultSummary(resultSummary, whyItFails, culprit, completeFix, fixExplanation) {
        const symptom = firstPresent(extractLabeledRcaValue(resultSummary, /^symptom$/i), firstMeaningfulRcaLine(resultSummary), firstMeaningfulRcaLine(whyItFails), firstMeaningfulRcaLine(culprit));
        const summaryRootCauses = extractRcaLinesAfterLabel(resultSummary, /^root causes?\b/i, 4);
        const rootCauses = summaryRootCauses.length
            ? summaryRootCauses
            : uniqueRcaLines([
                ...meaningfulRcaLines(whyItFails, 3),
                ...meaningfulRcaLines(culprit, 2)
            ]).slice(0, 4);
        const nextFix = firstPresent(extractLabeledRcaValue(resultSummary, /^(proposed next fix step|most likely next fix step)\b/i), firstMeaningfulRcaLine(completeFix), firstMeaningfulRcaLine(fixExplanation));
        return [
            symptom ? `- Symptom: ${symptom}` : "",
            rootCauses.length ? `- Root causes (from Jira evidence)\n${formatNumberedRcaLines(rootCauses)}` : "",
            nextFix ? `- Most likely next fix step: ${nextFix}` : ""
        ].filter(Boolean).join("\n\n");
    }
    function extractRcaHeading(finalMessage, payload) {
        var _a;
        const direct = String(finalMessage || "")
            .replace(/\r\n/g, "\n")
            .split("\n")
            .map((line) => line.trim().replace(/^#{1,6}\s+/, ""))
            .find((line) => /^RCA:\s*\S/i.test(line));
        if (direct) {
            return direct;
        }
        const request = ((_a = payload === null || payload === void 0 ? void 0 : payload.session) === null || _a === void 0 ? void 0 : _a.request) || {};
        const ticket = cleanRcaField(request.ticketId || (payload === null || payload === void 0 ? void 0 : payload.ticketId) || "");
        const title = cleanRcaField(request.issueTitle || request.derivedIssueTitle || "");
        if (ticket && title) {
            return `RCA: ${ticket} - ${title}`;
        }
        if (ticket) {
            return `RCA: ${ticket}`;
        }
        if (title) {
            return `RCA: ${title}`;
        }
        if (request.ticketSource === "description") {
            return "RCA: Problem Statement";
        }
        return "RCA";
    }
    function buildDefaultVerificationLoop(fields) {
        const fix = firstMeaningfulRcaLine(fields["Complete Fix"] || "");
        return [
            "- Not executed in this RCA-only run.",
            "",
            "- Next steps",
            fix ? `- ${fix}` : "- Build the target branch and run focused regression tests for the affected flow.",
            "- Validate the reported scenario against the baseline and proposed fix build.",
            "- Confirm no adjacent product flows regress."
        ].join("\n");
    }
    function buildDefaultUiValidation() {
        return [
            "- Not executed in this RCA-only run.",
            "- Pending validation: reproduce the reported workflow in the target product UI/workstation and confirm the corrected output."
        ].join("\n");
    }
    function buildDefaultStepByStepSolution(payload, fields) {
        var _a;
        const request = ((_a = payload === null || payload === void 0 ? void 0 : payload.session) === null || _a === void 0 ? void 0 : _a.request) || {};
        const ticket = cleanRcaField(request.ticketId || (payload === null || payload === void 0 ? void 0 : payload.ticketId) || (request.ticketSource === "description" ? "Problem Statement" : "requested issue"));
        const fixLines = meaningfulRcaLines(fields["Complete Fix"] || "", 4);
        const uncertainty = meaningfulRcaLines(fields["Remaining Uncertainty"] || "", 2);
        return [
            `- Scope: ${ticket}. No code changes were applied in this RCA-only run.`,
            "",
            "- Steps",
            ...(fixLines.length ? fixLines.map((line, index) => `${index + 1}) ${line}`) : [
                "1) Apply the proposed fix in the affected code path.",
                "2) Add targeted regression coverage for the reported scenario.",
                "3) Validate the fix on the product branch before handoff."
            ]),
            ...(uncertainty.length ? ["", "- Guardrails", ...uncertainty.map((line) => `- ${line}`)] : [])
        ].join("\n");
    }
    function normalizeAdvancedFieldBody(field, value) {
        if (field === "Attachment Evidence" || field === "Attachments") {
            return filterAttachmentDisplayText(value);
        }
        if (field === "Proposed Diff") {
            return buildAdvancedProposedDiffBlock(value);
        }
        if (field === "Confidence") {
            return extractConfidenceLevel(value);
        }
        if (field === "Code Evidence") {
            return stripWrappingFence(value);
        }
        return cleanRcaField(value);
    }
    function buildAdvancedAnalysis(payload) {
        var _a, _b, _c, _d, _e, _f;
        const fields = (payload === null || payload === void 0 ? void 0 : payload.rcaFields) || ((_b = (_a = payload === null || payload === void 0 ? void 0 : payload.session) === null || _a === void 0 ? void 0 : _a.parsed) === null || _b === void 0 ? void 0 : _b.rcaFields) || {};
        const sections = (payload === null || payload === void 0 ? void 0 : payload.sections) || ((_d = (_c = payload === null || payload === void 0 ? void 0 : payload.session) === null || _c === void 0 ? void 0 : _c.parsed) === null || _d === void 0 ? void 0 : _d.sections) || {};
        const finalMessage = (payload === null || payload === void 0 ? void 0 : payload.message) || ((_f = (_e = payload === null || payload === void 0 ? void 0 : payload.session) === null || _e === void 0 ? void 0 : _e.output) === null || _f === void 0 ? void 0 : _f.finalMessage) || "";
        const finalSections = parseFinalMessageSections(finalMessage);
        const resultSummary = cleanRcaField(firstPresent(sections["Result Summary"], pickFinalSection(finalSections, "Result Summary")));
        const whyItFails = cleanRcaField(firstPresent(fields["Why It Fails"], pickFinalSection(finalSections, "Why It Fails")));
        const culprit = cleanRcaField(firstPresent(fields.Culprit, pickFinalSection(finalSections, "Culprit")));
        const completeFix = cleanRcaField(firstPresent(fields["Complete Fix"], pickFinalSection(finalSections, "Complete Fix")));
        const fixExplanation = cleanRcaField(firstPresent(fields["Fix Explanation"], pickFinalSection(finalSections, "Fix Explanation")));
        const normalizedFields = Object.assign({}, fields);
        const rootCauseCode = cleanRcaField(firstPresent(fields["Root Cause Code"], pickFinalSection(finalSections, "Root Cause Code")));
        const codeEvidence = cleanRcaField(firstPresent(fields["Code Evidence"], pickFinalSection(finalSections, "Code Evidence")));
        const advancedRootCause = buildAdvancedRootCauseBlock(whyItFails, rootCauseCode, codeEvidence);
        const plan = pickAdvancedSection(sections, finalSections, "Plan") || buildDefaultAdvancedPlan(payload);
        const mcpCalls = pickAdvancedSection(sections, finalSections, "MCP Calls") || buildDefaultAdvancedMcpCalls();
        const summary = buildAdvancedResultSummary(resultSummary, whyItFails, culprit, completeFix, fixExplanation);
        const verificationLoop = pickAdvancedSection(sections, finalSections, "Verification Loop") || buildDefaultVerificationLoop(normalizedFields);
        const uiValidation = pickAdvancedSection(sections, finalSections, "UI Validation") || buildDefaultUiValidation();
        const stepByStepSolution = pickAdvancedSection(sections, finalSections, "Step-by-Step Solution") || buildDefaultStepByStepSolution(payload, normalizedFields);
        const rcaHeading = extractRcaHeading(finalMessage, payload);
        const parts = [
            plan ? `Plan\n${plan}` : "",
            mcpCalls ? `MCP Calls\n${mcpCalls}` : "",
            summary ? `Result Summary\n${summary}` : resultSummary ? `Result Summary\n${resultSummary}` : "",
            rcaHeading
        ];
        let advancedRootCauseInserted = false;
        let advancedProposedDiffInserted = false;
        for (const field of ADVANCED_RCA_FIELD_ORDER) {
            const body = normalizeAdvancedFieldBody(field, cleanRcaField(firstPresent(fields[field], pickFinalSection(finalSections, field))));
            if (body) {
                parts.push(`${field}\n${body}`);
                if (field === "Proposed Diff") {
                    advancedProposedDiffInserted = true;
                }
            }
            if (field === "Call Chain" && advancedRootCause) {
                parts.push(`Root Cause\n${advancedRootCause}`);
                advancedRootCauseInserted = true;
            }
        }
        if (advancedRootCause && !advancedRootCauseInserted) {
            parts.push(`Root Cause\n${advancedRootCause}`);
        }
        if (!advancedProposedDiffInserted) {
            parts.push(`Proposed Diff\n${buildAdvancedProposedDiffBlock("")}`);
        }
        parts.push(verificationLoop ? `Verification Loop\n${verificationLoop}` : "", uiValidation ? `UI Validation\n${uiValidation}` : "", stepByStepSolution ? `Step-by-Step Solution\n${stepByStepSolution}` : "");
        return parts.filter(Boolean).join("\n\n");
    }
    function buildCompressedRcaResult(payload) {
        var _a, _b, _c, _d, _e, _f;
        const fields = (payload === null || payload === void 0 ? void 0 : payload.rcaFields) || ((_b = (_a = payload === null || payload === void 0 ? void 0 : payload.session) === null || _a === void 0 ? void 0 : _a.parsed) === null || _b === void 0 ? void 0 : _b.rcaFields) || {};
        const sections = (payload === null || payload === void 0 ? void 0 : payload.sections) || ((_d = (_c = payload === null || payload === void 0 ? void 0 : payload.session) === null || _c === void 0 ? void 0 : _c.parsed) === null || _d === void 0 ? void 0 : _d.sections) || {};
        const finalMessage = (payload === null || payload === void 0 ? void 0 : payload.message) || ((_f = (_e = payload === null || payload === void 0 ? void 0 : payload.session) === null || _e === void 0 ? void 0 : _e.output) === null || _f === void 0 ? void 0 : _f.finalMessage) || "";
        const finalSections = parseFinalMessageSections(finalMessage);
        const resultSummary = cleanRcaField(firstPresent(sections["Result Summary"], pickFinalSection(finalSections, "Result Summary")));
        const culprit = cleanRcaField(firstPresent(fields.Culprit, pickFinalSection(finalSections, "Culprit")));
        const callChain = cleanRcaField(firstPresent(fields["Call Chain"], pickFinalSection(finalSections, "Call Chain")));
        const rootCauseCode = cleanRcaField(firstPresent(fields["Root Cause Code"], pickFinalSection(finalSections, "Root Cause Code")));
        const codeEvidence = cleanRcaField(firstPresent(fields["Code Evidence"], pickFinalSection(finalSections, "Code Evidence")));
        const logEvidence = cleanRcaField(firstPresent(fields["Log Evidence"], pickFinalSection(finalSections, "Log Evidence")));
        const reproEvidence = cleanRcaField(firstPresent(fields["Reproducible Evidence"], pickFinalSection(finalSections, "Reproducible Evidence")));
        const whyItFails = cleanRcaField(firstPresent(fields["Why It Fails"], pickFinalSection(finalSections, "Why It Fails")));
        const completeFix = cleanRcaField(firstPresent(fields["Complete Fix"], pickFinalSection(finalSections, "Complete Fix")));
        const fixExplanation = cleanRcaField(firstPresent(fields["Fix Explanation"], pickFinalSection(finalSections, "Fix Explanation")));
        const proposedDiff = cleanRcaField(firstPresent(fields["Proposed Diff"], pickFinalSection(finalSections, "Proposed Diff")));
        const affectedFiles = cleanRcaField(firstPresent(fields["All Affected Files"], pickFinalSection(finalSections, "All Affected Files")));
        const confidence = cleanRcaField(firstPresent(fields.Confidence, pickFinalSection(finalSections, "Confidence"), sections.Confidence));
        const confidenceLevel = confidence ? extractConfidenceLevel(confidence) : "";
        const remainingUncertainty = cleanRcaField(firstPresent(fields["Remaining Uncertainty"], pickFinalSection(finalSections, "Remaining Uncertainty")));
        const summary = buildSummaryBlock(resultSummary, whyItFails, culprit, completeFix, fixExplanation);
        const observedExpected = cleanRcaField(firstPresent(fields["Observed vs Expected"], pickFinalSection(finalSections, "Observed vs Expected"), buildObservedExpected(resultSummary, logEvidence, culprit, whyItFails)));
        const reproSufficiency = buildReproSufficiency(reproEvidence, logEvidence, rootCauseCode, confidenceLevel, remainingUncertainty);
        const evidence = buildEvidenceBlock(culprit, callChain, logEvidence, affectedFiles);
        const rootCause = buildRootCauseBlock(whyItFails, culprit, resultSummary);
        const rootCauseWithCode = buildRootCauseWithCodeBlock(rootCause, rootCauseCode, codeEvidence);
        const recommendedFix = buildRecommendedFix(completeFix, fixExplanation);
        const proposedDiffBlock = buildProposedDiffBlock(proposedDiff);
        const parts = [
            summary ? `Summary\n${summary}` : "",
            observedExpected ? `Observed vs Expected\n${observedExpected}` : "",
            reproSufficiency ? `Repro Sufficiency\n${reproSufficiency}` : "",
            evidence ? `Evidence\n${evidence}` : "",
            rootCauseWithCode ? `Root Cause\n${rootCauseWithCode}` : "",
            confidenceLevel ? `Confidence\n${confidenceLevel}` : "",
            remainingUncertainty ? `Remaining Uncertainty\n${remainingUncertainty}` : "",
            recommendedFix ? `Recommended Fix\n${recommendedFix}` : "",
            fixExplanation ? `Fix Explanation\n${fixExplanation}` : "",
            affectedFiles ? `Files to update\n${affectedFiles}` : "",
            `Proposed Diff\n${proposedDiffBlock}`,
        ].filter(Boolean);
        return parts.join("\n\n");
    }
    function parseRcaResultSections(value) {
        const sections = [];
        const lines = String(value || "").replace(/\r\n/g, "\n").split("\n");
        let activeHeading = "";
        let activeLines = [];
        let inFence = false;
        function flush() {
            if (activeHeading) {
                const body = normalizeDisplayedSectionBody(activeHeading, activeLines.join("\n"));
                const previous = sections[sections.length - 1];
                if (body && previous && normalizeSectionName(previous.heading) === normalizeSectionName(activeHeading)) {
                    previous.body = [previous.body, body].filter(Boolean).join("\n\n");
                }
                else if (body) {
                    sections.push({
                        heading: activeHeading,
                        body
                    });
                }
            }
            activeHeading = "";
            activeLines = [];
        }
        for (const line of lines) {
            const trimmed = line.trim();
            if (/^```/.test(trimmed)) {
                inFence = !inFence;
                if (activeHeading) {
                    activeLines.push(line);
                }
                continue;
            }
            const heading = stripMarkdownHeading(trimmed.replace(/\*\*/g, ""));
            const isSectionHeading = Boolean(heading) && RCA_RESULT_DISPLAY_SECTION_NAMES.some((name) => normalizeSectionName(name) === normalizeSectionName(heading));
            if (!inFence && isSectionHeading) {
                flush();
                activeHeading = heading;
                continue;
            }
            if (activeHeading) {
                activeLines.push(line);
            }
        }
        flush();
        return sections;
    }
    function stripMarkdownHeading(value) {
        return value.replace(/^#{1,6}\s+/, "").replace(/:$/, "").trim();
    }
    function getRcaToneClass(sectionName) {
        const normalized = normalizeSectionName(sectionName);
        if (normalized === "summary") {
            return "is-summary";
        }
        if (normalized === "recommended fix"
            || normalized === "fix explanation"
            || normalized === "files to update"
            || normalized === "proposed diff"
            || normalized === "proposed solution") {
            return "is-fix";
        }
        return "";
    }
    function getConfidenceToneClass(value) {
        const level = extractConfidenceLevel(value);
        return isPositiveConfidenceLevel(level) ? "is-confidence-high" : "is-confidence-other";
    }
    function getRcaSectionClass(sectionName, body = "") {
        const toneClass = getRcaToneClass(sectionName);
        if (normalizeSectionName(sectionName) === "confidence") {
            return [toneClass, getConfidenceToneClass(body)].filter(Boolean).join(" ");
        }
        return toneClass;
    }
    function isRichHeading(line) {
        const normalized = line.trim();
        if (!normalized) {
            return false;
        }
        if (/^#{1,6}\s+/.test(normalized)) {
            return true;
        }
        if (/^(Plan|MCP Calls|Result Summary|RCA|Comments|Comment Evidence|Audit History|Attachment Evidence|Attachments|Reproducible Evidence|Subsystem|Investigation Tier|Culprit|Call Chain|Root Cause Code|Code Evidence|Log Evidence|Why It Fails|Complete Fix|Fix Explanation|Files to update|Proposed Diff|Proposed Solution|All Affected Files|Confidence|Remaining Uncertainty|Verification Loop|UI Validation|Step-by-Step Solution|Summary|Observed vs Expected|Repro Sufficiency|Evidence|Root Cause|Recommended Fix)$/i.test(normalized.replace(/:$/, ""))) {
            return true;
        }
        return normalized.length <= 70 && /:$/.test(normalized) && !/^\d+\./.test(normalized);
    }
    function isStandaloneInlineCode(line) {
        return /^`[^`]+`[.;,:]?$/.test(line.trim());
    }
    function cleanStandaloneCode(line) {
        return line.trim().replace(/^`/, "").replace(/`[.;,:]?$/, "");
    }
    function renderInlineCode(text) {
        return text.split(/(`[^`]+`|[A-Za-z]:\\[^\s,;:)]+|(?:[\w.-]+[\\/])+[\w.-]+\.(?:cs|js|tsx|ts|json|xml|md|config|toml|cmd|ps1|sh)|[\w.-]+\.(?:cs|js|tsx|ts|json|xml|md|config|toml|cmd|ps1|sh)(?::\d+)?)/g).filter(Boolean).map((part, index) => {
            if (/^`[^`]+`$/.test(part)) {
                return (0, jsx_runtime_1.jsx)("code", { class: "inline-code", children: part.slice(1, -1) }, `code-${index}`);
            }
            if (/(?:[\\/]|\.)(?:cs|js|tsx|ts|json|xml|md|config|toml|cmd|ps1|sh)(?::\d+)?$/i.test(part)) {
                return (0, jsx_runtime_1.jsx)("code", { class: "file-token", children: part }, `file-${index}`);
            }
            return (0, jsx_runtime_1.jsx)("span", { children: part }, `text-${index}`);
        });
    }
    function collapseRepeatedLiveFileRefs(text) {
        const filePattern = /(?:[A-Za-z]:\\[^\s,;:)]+|(?:[\w.-]+[\\/])+[\w.-]+\.(?:cs|js|tsx|ts|json|xml|md|config|toml|cmd|ps1|sh)|[\w.-]+\.(?:cs|js|tsx|ts|json|xml|md|config|toml|cmd|ps1|sh)(?::\d+)?)/gi;
        const matches = [...String(text || "").matchAll(filePattern)];
        const seen = new Map();
        for (const match of matches) {
            const token = match[0];
            const refMatch = token.match(/^(.*?)(?::(\d+))$/);
            const base = refMatch ? refMatch[1] : token;
            const key = base.toLowerCase();
            const entry = seen.get(key) || { first: base, refs: [], count: 0 };
            entry.count += 1;
            if ((refMatch === null || refMatch === void 0 ? void 0 : refMatch[2]) && !entry.refs.includes(refMatch[2])) {
                entry.refs.push(refMatch[2]);
            }
            seen.set(key, entry);
        }
        let result = String(text || "");
        for (const entry of seen.values()) {
            if (entry.count < 2) {
                continue;
            }
            let firstWritten = false;
            result = result.replace(filePattern, (token) => {
                const refMatch = token.match(/^(.*?)(?::(\d+))$/);
                const base = refMatch ? refMatch[1] : token;
                if (base.toLowerCase() !== entry.first.toLowerCase()) {
                    return token;
                }
                if (firstWritten) {
                    return "";
                }
                firstWritten = true;
                return entry.first;
            });
        }
        return result
            .replace(/\s{2,}/g, " ")
            .replace(/\s+([,;:)])/g, "$1")
            .replace(/([,(;:])\s*([,);])/g, "$2")
            .trim();
    }
    function isCommandLikeLine(value) {
        return /^\s*(npm|npx|node|git|rg|Get-ChildItem|Select-String|Invoke-WebRequest|powershell|cmd|codex|dotnet|msbuild|where|docker)\b/i.test(value)
            || /\b(exec|spawn|command|started|completed|failed)\b/i.test(value) && /\b(node|npm|git|rg|codex|dotnet|powershell|cmd)\b/i.test(value);
    }
    function isSearchCommand(value) {
        return /\b(rg|Select-String|Get-ChildItem|findstr)\b/i.test(String(value || ""));
    }
    function summarizeSearchCommand(value) {
        const command = String(value || "").replace(/\s+/g, " ").trim();
        if (!command) {
            return "targeted source search";
        }
        return compactText(command, 160);
    }
    function summarizeSearchOutput(value) {
        const lines = String(value || "")
            .replace(/\r\n/g, "\n")
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);
        if (!lines.length) {
            return "";
        }
        const preview = lines.slice(0, 8).join("\n");
        const omitted = lines.length > 8 ? `\n... ${lines.length - 8} more result lines hidden in live view.` : "";
        return `Search result preview:\n${compactText(preview, 900)}${omitted}`;
    }
    function renderLiveLine(text) {
        const displayText = collapseRepeatedLiveFileRefs(text);
        const isLocalAgentWarning = text.includes(LOCAL_AGENT_DISCONNECTED_NOTICE);
        const kind = isLocalAgentWarning
            ? "warning local-agent-warning"
            : /^RCA successful:/i.test(text)
                ? "success"
                : /^RCA failed:/i.test(text)
                    ? "error"
                    : /^RCA stopped:/i.test(text)
                        ? "warning"
                        : /^warning:|^stderr:/i.test(text)
                            ? "warning"
                            : isCommandLikeLine(text)
                                ? "command"
                                : "";
        return ((0, jsx_runtime_1.jsx)("p", { class: `live-output-line ${kind}`, children: renderInlineCode(displayText) }));
    }
    function shouldSuppressLiveLine(text) {
        const normalized = String(text || "").trim();
        return /\bNo stdout or stderr has arrived for\b/i.test(normalized)
            || /^item\.complete/i.test(normalized);
    }
    function formatSessionHistoryTitle(session) {
        var _a, _b, _c, _d, _e, _f, _g;
        return compactText(((_a = session.request) === null || _a === void 0 ? void 0 : _a.displayName)
            || ((_b = session.summary) === null || _b === void 0 ? void 0 : _b.displayName)
            || [
                ((_c = session.request) === null || _c === void 0 ? void 0 : _c.ticketId) || ((_d = session.summary) === null || _d === void 0 ? void 0 : _d.ticketId),
                ((_e = session.request) === null || _e === void 0 ? void 0 : _e.issueTitle) || ((_f = session.request) === null || _f === void 0 ? void 0 : _f.derivedIssueTitle) || ((_g = session.summary) === null || _g === void 0 ? void 0 : _g.preview)
            ].filter(Boolean).join(" - ")
            || session.id, 88);
    }
    function normalizeRunState(value) {
        const normalized = String(value || "").toLowerCase();
        if (normalized === "completed") {
            return "completed";
        }
        if (normalized === "running") {
            return "running";
        }
        if (normalized === "cancelled" || normalized === "stopped" || normalized === "interrupted") {
            return "stopped";
        }
        if (normalized === "failed") {
            return "failed";
        }
        return "idle";
    }
    function renderCodeBlock(lines, key) {
        return ((0, jsx_runtime_1.jsx)("pre", { class: "rich-code-block", children: (0, jsx_runtime_1.jsx)("code", { children: lines.map((line, index) => {
                    const trimmed = line.trimStart();
                    const diffClass = trimmed.startsWith("+")
                        ? "diff-add"
                        : trimmed.startsWith("-")
                            ? "diff-remove"
                            : "";
                    return (0, jsx_runtime_1.jsx)("span", { class: diffClass, children: line || " " }, `${key}-line-${index}`);
                }) }) }, key));
    }
    function renderRichText(value, variant = "default") {
        const lines = String(value || "").replace(/\r\n/g, "\n").split("\n");
        const blocks = [];
        let paragraph = [];
        let code = [];
        let inFence = false;
        let activeRichHeading = "";
        function flushParagraph() {
            const text = paragraph.join("\n").trim();
            paragraph = [];
            if (!text) {
                return;
            }
            const singleLine = !text.includes("\n");
            if (singleLine && isRichHeading(text)) {
                const headingText = stripMarkdownHeading(text);
                activeRichHeading = normalizeSectionName(headingText);
                blocks.push((0, jsx_runtime_1.jsx)("h3", { class: `rich-heading ${getRcaToneClass(headingText)}`.trim(), children: headingText }, `heading-${blocks.length}`));
                return;
            }
            const isConfidenceParagraph = activeRichHeading === "confidence";
            const displayText = isConfidenceParagraph ? extractConfidenceLevel(text) : text;
            const displayLines = displayText.split("\n");
            const paragraphClass = [
                "rich-paragraph",
                isConfidenceParagraph ? "confidence-value" : "",
                isConfidenceParagraph ? (isPositiveConfidenceLevel(displayText) ? "is-confidence-high" : "is-confidence-other") : ""
            ].filter(Boolean).join(" ");
            blocks.push((0, jsx_runtime_1.jsx)("p", { class: paragraphClass, children: displayLines.map((line, index) => ((0, jsx_runtime_1.jsxs)("span", { children: [renderInlineCode(line), index < displayLines.length - 1 ? (0, jsx_runtime_1.jsx)("br", {}) : null] }, `paragraph-line-${index}`))) }, `paragraph-${blocks.length}`));
            if (isConfidenceParagraph) {
                activeRichHeading = "";
            }
        }
        function flushCode() {
            if (!code.length) {
                return;
            }
            blocks.push(renderCodeBlock(code, `code-${blocks.length}`));
            code = [];
        }
        for (const rawLine of lines) {
            const line = rawLine.replace(/\s+$/, "");
            if (/^```/.test(line.trim())) {
                if (inFence) {
                    flushCode();
                    inFence = false;
                }
                else {
                    flushParagraph();
                    inFence = true;
                }
                continue;
            }
            if (inFence) {
                code.push(line);
                continue;
            }
            if (!line.trim()) {
                flushParagraph();
                continue;
            }
            if (isStandaloneInlineCode(line)) {
                flushParagraph();
                blocks.push(renderCodeBlock([cleanStandaloneCode(line)], `inline-code-block-${blocks.length}`));
                continue;
            }
            if (isRichHeading(line)) {
                flushParagraph();
                const headingText = stripMarkdownHeading(line);
                activeRichHeading = normalizeSectionName(headingText);
                blocks.push((0, jsx_runtime_1.jsx)("h3", { class: `rich-heading ${getRcaToneClass(headingText)}`.trim(), children: headingText }, `heading-${blocks.length}`));
                continue;
            }
            paragraph.push(line);
        }
        flushParagraph();
        flushCode();
        if (!blocks.length) {
            return (0, jsx_runtime_1.jsx)("p", { class: "rich-paragraph", children: value });
        }
        return (0, jsx_runtime_1.jsx)("div", { class: `rich-output ${variant}`, children: blocks });
    }
    exports.App = (0, ojvcomponent_1.registerCustomElement)("app-root", ({ appName = "Oracle Restaurants RCA", userLogin = "Signed in" }) => {
        const [runtime, setRuntime] = (0, hooks_1.useState)({
            connected: false,
            platform: "",
            serverMode: "",
            requireElevatedExecution: false,
            elevated: false,
            products: FALLBACK_PRODUCTS,
            defaultPrompt: ""
        });
        const [authUser, setAuthUser] = (0, hooks_1.useState)(null);
        const [localAgentStatus, setLocalAgentStatus] = (0, hooks_1.useState)(EMPTY_LOCAL_AGENT_STATUS);
        const [developerMode, setDeveloperMode] = (0, hooks_1.useState)(false);
        const [selectedProduct, setSelectedProduct] = (0, hooks_1.useState)("simphony");
        const [folderPath, setFolderPath] = (0, hooks_1.useState)("");
        const [ticketType, setTicketType] = (0, hooks_1.useState)("jira");
        const [ticketId, setTicketId] = (0, hooks_1.useState)("");
        const [bugDescription, setBugDescription] = (0, hooks_1.useState)("");
        const [isBrowsingWorkspace, setIsBrowsingWorkspace] = (0, hooks_1.useState)(false);
        const [chatHistory, setChatHistory] = (0, hooks_1.useState)(DEFAULT_CHAT);
        const [sessionHistory, setSessionHistory] = (0, hooks_1.useState)([]);
        const [selectedHistoryId, setSelectedHistoryId] = (0, hooks_1.useState)("");
        const [deletingSessionId, setDeletingSessionId] = (0, hooks_1.useState)("");
        const [liveOutput, setLiveOutput] = (0, hooks_1.useState)([]);
        const [rcaResult, setRcaResult] = (0, hooks_1.useState)("");
        const [advancedAnalysis, setAdvancedAnalysis] = (0, hooks_1.useState)("");
        const [activeView, setActiveView] = (0, hooks_1.useState)("workspace");
        const [runState, setRunState] = (0, hooks_1.useState)("idle");
        const [statusText, setStatusText] = (0, hooks_1.useState)("Ready");
        const [currentSessionId, setCurrentSessionId] = (0, hooks_1.useState)("");
        const [isLoadingConfig, setIsLoadingConfig] = (0, hooks_1.useState)(true);
        const [leftPanelCollapsed, setLeftPanelCollapsed] = (0, hooks_1.useState)(false);
        const [activeUsersData, setActiveUsersData] = (0, hooks_1.useState)({
            count: 0,
            users: [],
            open: false
        });
        const controllerRef = (0, hooks_1.useRef)(null);
        const liveOutputRef = (0, hooks_1.useRef)(null);
        const endNoticeShownRef = (0, hooks_1.useRef)(false);
        const lastFailureDetailRef = (0, hooks_1.useRef)("");
        const products = (0, hooks_1.useMemo)(() => normalizeProducts(runtime.products || []), [runtime.products]);
        const selectedProductConfig = products.find((product) => product.key === selectedProduct) || products[0];
        const workspace = developerMode
            ? folderPath.trim()
            : (selectedProductConfig === null || selectedProductConfig === void 0 ? void 0 : selectedProductConfig.defaultWorkspace) || "";
        const isDescriptionTicket = ticketType === "description";
        const ticketSourceLabel = isDescriptionTicket ? "Problem Statement" : ticketType === "bugdb" ? "BugDB" : "Jira";
        const ticketInputLabel = isDescriptionTicket ? "Problem Statement" : ticketType === "bugdb" ? "BugDB Number" : "Jira Number";
        const ticketPlaceholder = ticketType === "bugdb" ? "38884123" : "FPS-137892";
        const ticketReady = isDescriptionTicket ? Boolean(bugDescription.trim()) : Boolean(ticketId.trim());
        const developerAgentReady = !developerMode || localAgentStatus.connected;
        const canRun = ticketReady && Boolean(workspace) && developerAgentReady && runState !== "running";
        const runDisabledReason = runState === "running"
            ? "RCA is already running."
            : developerMode && !localAgentStatus.connected
                ? "Start the local client agent on your machine before starting RCA."
                : developerMode && !folderPath.trim()
                    ? "Please select the code folder before starting RCA."
                    : !ticketReady
                        ? `Please enter the ${ticketInputLabel} before starting RCA.`
                        : !workspace
                            ? "Please select a source before starting RCA."
                            : "";
        const advancedEnabled = runState === "completed" || Boolean(advancedAnalysis);
        const runButtonLabel = selectedHistoryId && runState !== "running" ? "Re Run" : "Start RCA";
        const signedInLabel = (authUser === null || authUser === void 0 ? void 0 : authUser.displayName) || (authUser === null || authUser === void 0 ? void 0 : authUser.email) || (authUser === null || authUser === void 0 ? void 0 : authUser.username) || userLogin;
        const contextLines = (0, hooks_1.useMemo)(() => {
            const sourceMode = developerMode ? "Developer Mode" : "Product Mode";
            const sourceLabel = developerMode
                ? folderPath.trim() || "No developer workspace selected"
                : (selectedProductConfig === null || selectedProductConfig === void 0 ? void 0 : selectedProductConfig.label) || selectedProduct || "No product selected";
            const ticketLabel = isDescriptionTicket
                ? `Problem Statement: ${bugDescription.trim() ? "provided" : "waiting for input"}`
                : ticketId.trim()
                    ? `${ticketSourceLabel}: ${ticketId.trim()}`
                    : `${ticketSourceLabel}: waiting for input`;
            const lines = [
                `Mode: ${sourceMode}`,
                developerMode ? `Workspace: ${sourceLabel}` : `Product: ${sourceLabel}`,
                ticketLabel
            ];
            if (runState === "idle") {
                lines.push(canRun ? "Ready: start RCA when you are ready." : "Next: choose source details and enter the ticket number or problem statement.");
            }
            return lines;
        }, [bugDescription, canRun, developerMode, folderPath, isDescriptionTicket, runState, selectedProduct, selectedProductConfig, ticketId, ticketSourceLabel, ticketType]);
        (0, hooks_1.useEffect)(() => {
            Context.getPageContext().getBusyContext().applicationBootstrapComplete();
            loadInitialState();
        }, []);
        (0, hooks_1.useEffect)(() => {
            if (developerMode) {
                loadLocalAgentStatus();
            }
            if (!developerMode || localAgentStatus.connected) {
                return undefined;
            }
            const timer = window.setInterval(() => {
                loadLocalAgentStatus();
            }, LOCAL_AGENT_RECONNECT_MS);
            return () => window.clearInterval(timer);
        }, [developerMode, localAgentStatus.connected]);
        (0, hooks_1.useEffect)(() => {
            setLiveOutput((lines) => {
                const withoutNotice = lines.filter((line) => line !== LOCAL_AGENT_DISCONNECTED_NOTICE);
                if (developerMode && !localAgentStatus.connected) {
                    return [...withoutNotice, LOCAL_AGENT_DISCONNECTED_NOTICE].slice(-500);
                }
                return withoutNotice;
            });
        }, [developerMode, localAgentStatus.connected]);
        (0, hooks_1.useEffect)(() => {
            if (liveOutputRef.current) {
                liveOutputRef.current.scrollTop = liveOutputRef.current.scrollHeight;
            }
        }, [liveOutput]);
        (0, hooks_1.useEffect)(() => {
            function sendHeartbeat() {
                fetchJson("/api/heartbeat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({})
                }).catch(() => { });
            }
            function fetchActiveUsers() {
                fetchJson("/api/active-users")
                    .then((data) => {
                    setActiveUsersData((previous) => (Object.assign(Object.assign({}, previous), { count: data.count || 0, users: Array.isArray(data.users) ? data.users : [] })));
                })
                    .catch(() => { });
            }
            sendHeartbeat();
            fetchActiveUsers();
            const heartbeatTimer = window.setInterval(sendHeartbeat, 30000);
            const usersTimer = window.setInterval(fetchActiveUsers, 30000);
            return () => {
                window.clearInterval(heartbeatTimer);
                window.clearInterval(usersTimer);
            };
        }, []);
        function loadInitialState() {
            return __awaiter(this, void 0, void 0, function* () {
                setIsLoadingConfig(true);
                yield Promise.all([loadConfig(), loadAuth(), loadLocalAgentStatus(), loadSessionHistory()]);
                setIsLoadingConfig(false);
            });
        }
        function loadConfig() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const config = yield fetchJson("/api/config");
                    setRuntime({
                        connected: true,
                        platform: config.platform || "",
                        serverMode: config.serverMode || "",
                        requireElevatedExecution: Boolean(config.requireElevatedExecution),
                        elevated: Boolean(config.elevated),
                        products: normalizeProducts(config.products || []),
                        defaultPrompt: config.defaultPrompt || ""
                    });
                }
                catch (error) {
                    setRuntime((previous) => (Object.assign(Object.assign({}, previous), { connected: false })));
                }
            });
        }
        function loadAuth() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const auth = yield fetchJson("/auth/me");
                    setAuthUser(auth.user || null);
                }
                catch (error) {
                    setAuthUser(null);
                }
            });
        }
        function loadLocalAgentStatus() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const brokerStatus = yield fetchJson("/api/broker/status");
                    if (brokerStatus.connected) {
                        setLocalAgentStatus({
                            connected: true,
                            host: brokerStatus.machineName || "user machine",
                            port: Number(brokerStatus.localPort || 3210),
                            serverMode: "broker",
                            elevated: false,
                            requireElevatedExecution: false,
                            transport: "broker"
                        });
                        return;
                    }
                }
                catch (error) {
                }
                try {
                    const status = yield fetchJson(`${DEFAULT_LOCAL_AGENT_BASE_URL}/api/health`);
                    if (status.serverMode !== "agent") {
                        setLocalAgentStatus(EMPTY_LOCAL_AGENT_STATUS);
                        return;
                    }
                    setLocalAgentStatus({
                        connected: Boolean(status.ok),
                        host: status.host || "",
                        port: Number(status.port || 3210),
                        serverMode: status.serverMode || "",
                        elevated: Boolean(status.elevated),
                        requireElevatedExecution: Boolean(status.requireElevatedExecution),
                        transport: "direct"
                    });
                }
                catch (error) {
                    setLocalAgentStatus(EMPTY_LOCAL_AGENT_STATUS);
                }
            });
        }
        function loadSessionHistory() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const result = yield fetchJson("/api/sessions");
                    setSessionHistory(Array.isArray(result.sessions) ? result.sessions : []);
                }
                catch (error) {
                    setSessionHistory([]);
                }
            });
        }
        function openHistorySession(sessionId) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!sessionId) {
                    return;
                }
                try {
                    const session = yield fetchJson(`/api/sessions/${encodeURIComponent(sessionId)}`);
                    const output = (session === null || session === void 0 ? void 0 : session.output) || {};
                    const request = (session === null || session === void 0 ? void 0 : session.request) || {};
                    const liveLines = String(output.liveText || "")
                        .replace(/\r\n/g, "\n")
                        .split("\n")
                        .map((line) => line.trimEnd())
                        .filter((line) => line && !shouldSuppressLiveLine(line));
                    setSelectedHistoryId(sessionId);
                    setCurrentSessionId(sessionId);
                    setLiveOutput(liveLines.slice(-500));
                    setRcaResult(buildCompressedRcaResult({ session }) || output.finalMessage || "");
                    setAdvancedAnalysis(buildAdvancedAnalysis({ session }) || output.finalMessage || "");
                    setRunState(normalizeRunState(session.status));
                    setStatusText(session.status ? String(session.status) : "Loaded");
                    setActiveView("workspace");
                    const nextTicketType = request.ticketSource === "bugdb"
                        ? "bugdb"
                        : request.ticketSource === "description"
                            ? "description"
                            : "jira";
                    setTicketType(nextTicketType);
                    if (nextTicketType === "description") {
                        setBugDescription(String(request.bugDescription || ""));
                        setTicketId("");
                    }
                    else {
                        setTicketId(String(request.ticketId || ""));
                        setBugDescription("");
                    }
                    if (request.product && products.some((product) => product.key === request.product)) {
                        setDeveloperMode(false);
                        setSelectedProduct(request.product);
                    }
                    else if (request.workspace) {
                        setDeveloperMode(true);
                        setFolderPath(String(request.workspace || ""));
                    }
                }
                catch (error) {
                    appendLive(`History load failed: ${compactText(error.message, 180)}`);
                }
            });
        }
        function deleteHistorySession(sessionId) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!sessionId || deletingSessionId) {
                    return;
                }
                setDeletingSessionId(sessionId);
                try {
                    yield fetchJson(`/api/sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE" });
                    setSessionHistory((sessions) => sessions.filter((session) => session.id !== sessionId));
                    if (selectedHistoryId === sessionId) {
                        setSelectedHistoryId("");
                        setCurrentSessionId("");
                        setLiveOutput([]);
                        setRcaResult("");
                        setAdvancedAnalysis("");
                        setRunState("idle");
                        setStatusText("Ready");
                        setActiveView("workspace");
                    }
                }
                catch (error) {
                    appendLive(`Delete failed: ${compactText(error.message, 180)}`);
                }
                finally {
                    setDeletingSessionId("");
                }
            });
        }
        function developerApiUrl(apiPath) {
            const normalizedPath = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;
            if (localAgentStatus.transport === "broker") {
                return normalizedPath.startsWith("/api/")
                    ? `/api/broker/${normalizedPath.slice("/api/".length)}`
                    : `/api/broker${normalizedPath}`;
            }
            return `${DEFAULT_LOCAL_AGENT_BASE_URL}${normalizedPath}`;
        }
        function addChat(role, text) {
            setChatHistory((messages) => [
                ...messages,
                {
                    id: `${Date.now()}-${messages.length}`,
                    role,
                    text,
                    time: formatClock()
                }
            ]);
        }
        function appendLive(text) {
            if (shouldSuppressLiveLine(text)) {
                return;
            }
            setLiveOutput((lines) => [...lines, formatErrorMessage(text)].slice(-500));
        }
        function stopRun() {
            return __awaiter(this, void 0, void 0, function* () {
                if (controllerRef.current) {
                    controllerRef.current.abort();
                }
                if (currentSessionId) {
                    try {
                        const stopUrl = developerMode
                            ? developerApiUrl(`/api/sessions/${encodeURIComponent(currentSessionId)}/stop`)
                            : `/api/sessions/${encodeURIComponent(currentSessionId)}/stop`;
                        yield fetchJson(stopUrl, { method: "POST" });
                    }
                    catch (error) {
                        appendLive(`Stop request note: ${error.message}`);
                    }
                }
                setRunState("stopped");
                setStatusText("Stopped");
                appendLive("RCA stopped: the active run was cancelled before completion.");
                addChat("system", "The active RCA run was stopped.");
            });
        }
        function browseWorkspace() {
            return __awaiter(this, void 0, void 0, function* () {
                if (developerMode && !localAgentStatus.connected) {
                    yield loadLocalAgentStatus();
                    appendLive(`Browse failed: ${LOCAL_AGENT_DISCONNECTED_NOTICE}`);
                    return;
                }
                setIsBrowsingWorkspace(true);
                try {
                    const params = new URLSearchParams();
                    if (folderPath.trim()) {
                        params.set("current", folderPath.trim());
                    }
                    const browseUrl = developerMode ? developerApiUrl("/api/pick-workspace") : "/api/pick-workspace";
                    const result = yield fetchJson(`${browseUrl}?${params.toString()}`);
                    if (result.path) {
                        setFolderPath(result.path);
                        appendLive(`Workspace selected: ${result.path}`);
                        return;
                    }
                    appendLive(result.message || "No developer workspace was selected.");
                }
                catch (error) {
                    appendLive(`Browse failed: ${compactText(error.message, 150)}`);
                }
                finally {
                    setIsBrowsingWorkspace(false);
                }
            });
        }
        function startRun() {
            return __awaiter(this, void 0, void 0, function* () {
                if (!canRun) {
                    addChat("system", "Add the required ticket and workspace details before starting RCA.");
                    return;
                }
                const productLabel = developerMode ? "Developer Workspace" : (selectedProductConfig === null || selectedProductConfig === void 0 ? void 0 : selectedProductConfig.label) || selectedProduct;
                const descriptionText = bugDescription.trim();
                const ticketLabel = isDescriptionTicket ? "Problem Statement" : `${ticketSourceLabel} ${ticketId.trim()}`;
                const nextController = new AbortController();
                controllerRef.current = nextController;
                setRunState("running");
                setStatusText("Running");
                setCurrentSessionId("");
                setSelectedHistoryId("");
                endNoticeShownRef.current = false;
                lastFailureDetailRef.current = "";
                setLiveOutput([]);
                setRcaResult("");
                setAdvancedAnalysis("");
                setActiveView("workspace");
                addChat("user", `${ticketLabel} RCA for ${productLabel}`);
                try {
                    let prefetchedTicketEvidence = null;
                    if (ticketType === "jira" || ticketType === "bugdb") {
                        appendLive(`Fetching ${ticketType === "bugdb" ? "BugDB" : "Jira"} evidence for ${ticketId.trim()}`);
                        const evidenceUrl = "/api/ticket-evidence";
                        prefetchedTicketEvidence = yield fetchJson(evidenceUrl, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                ticketSource: ticketType,
                                ticketId: ticketId.trim()
                            })
                        });
                    }
                    const runUrl = developerMode ? developerApiUrl("/api/run") : "/api/run";
                    const response = yield fetch(runUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "text/event-stream"
                        },
                        body: JSON.stringify({
                            mode: "analyze",
                            continueSession: false,
                            product: developerMode ? productLabel : selectedProduct,
                            productLabel,
                            workspace,
                            workspaceMode: "local",
                            ticketSource: ticketType,
                            ticketId: isDescriptionTicket ? "" : ticketId.trim(),
                            bugDescription: isDescriptionTicket ? descriptionText : "",
                            issueTitle: (prefetchedTicketEvidence === null || prefetchedTicketEvidence === void 0 ? void 0 : prefetchedTicketEvidence.issueTitle) || "",
                            jiraEvidence: (prefetchedTicketEvidence === null || prefetchedTicketEvidence === void 0 ? void 0 : prefetchedTicketEvidence.jiraEvidence) || null,
                            bugDbEvidence: (prefetchedTicketEvidence === null || prefetchedTicketEvidence === void 0 ? void 0 : prefetchedTicketEvidence.bugDbEvidence) || null,
                            version: "",
                            model: "",
                            extraInstructions: PRODUCT_GENERIC_GUIDANCE
                        }),
                        signal: nextController.signal
                    });
                    if (!response.ok || !response.body) {
                        const body = yield response.text();
                        throw new Error(body || `Run failed with HTTP ${response.status}`);
                    }
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let buffer = "";
                    while (true) {
                        const { done, value } = yield reader.read();
                        if (done) {
                            break;
                        }
                        buffer += decoder.decode(value, { stream: true });
                        const blocks = buffer.replace(/\r\n/g, "\n").split("\n\n");
                        buffer = blocks.pop() || "";
                        for (const block of blocks) {
                            handleStreamBlock(block);
                        }
                    }
                }
                catch (error) {
                    if (error.name === "AbortError") {
                        return;
                    }
                    setRunState("failed");
                    setStatusText("Failed");
                    appendLive(`RCA failed: ${formatErrorMessage(error)}`);
                    addChat("assistant", `The RCA run failed: ${compactText(formatErrorMessage(error), 180)}`);
                }
                finally {
                    controllerRef.current = null;
                }
            });
        }
        function handleStreamBlock(block) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            const parsed = parseSseBlock(block);
            if (!parsed) {
                return;
            }
            const { eventName, payload } = parsed;
            if (eventName === "status") {
                setCurrentSessionId(payload.sessionId || "");
                appendLive(`Session started: ${payload.displayName || payload.sessionId || "RCA run"}`);
                return;
            }
            if (eventName === "codex_event") {
                const parsedEvent = payload.parsed || payload || {};
                const item = parsedEvent.item || payload.item || {};
                const eventType = parsedEvent.type || payload.type || "";
                if (["thread.started", "turn.started", "item.started", "item.end"].includes(eventType)) {
                    return;
                }
                if (eventType === "item.completed" && item.type === "command_execution") {
                    const command = item.command || "";
                    const status = item.status === "failed" ? "failed" : "completed";
                    const output = item.aggregated_output || item.error || "";
                    if (isSearchCommand(command)) {
                        appendLive(`Search ${status}: ${summarizeSearchCommand(command)}`);
                        const summarizedOutput = summarizeSearchOutput(output);
                        if (summarizedOutput) {
                            appendLive(summarizedOutput);
                        }
                    }
                    else {
                        appendLive(command ? `Command ${status}: ${command}` : `Command ${status}`);
                        if (output) {
                            appendLive(output);
                        }
                    }
                    return;
                }
                if (eventType === "item.completed" && item.type === "mcp_tool_call") {
                    const tool = [item.server, item.tool].filter(Boolean).join(".");
                    appendLive(item.status === "failed"
                        ? `Support lookup failed: ${tool || "MCP tool"} ${item.error || ""}`.trim()
                        : `Support lookup completed: ${tool || "MCP tool"}`);
                    return;
                }
                if (eventType === "item.completed") {
                    return;
                }
                if (eventType === "ticket.preflight") {
                    appendLive(payload.text || "Ticket preflight: fetching ticket details first.");
                    return;
                }
                if (eventType === "ticket.details") {
                    const detailLines = Array.isArray(payload.lines) ? payload.lines : [];
                    if (detailLines.length) {
                        detailLines.forEach((line) => appendLive(compactText(line, 320)));
                    }
                    else if (payload.text) {
                        appendLive(compactText(payload.text, 320));
                    }
                    return;
                }
                const message = ((_a = payload.message) === null || _a === void 0 ? void 0 : _a.content)
                    || ((_b = payload.item) === null || _b === void 0 ? void 0 : _b.text)
                    || ((_c = payload.item) === null || _c === void 0 ? void 0 : _c.message)
                    || payload.delta
                    || payload.text
                    || payload.type
                    || "";
                if (message) {
                    appendLive(compactText(message, 900));
                }
                return;
            }
            if (eventName === "stderr" || eventName === "warning") {
                const detail = payload.text || payload.message || payload.detail || "";
                if (eventName === "stderr" && detail) {
                    lastFailureDetailRef.current = String(detail);
                }
                appendLive(`${eventName}: ${compactText(detail, 700)}`);
                return;
            }
            if (eventName === "error") {
                const detail = payload.error || payload.message || "The RCA run failed before Codex produced output.";
                lastFailureDetailRef.current = String(detail);
                setRunState("failed");
                setStatusText("Failed");
                setRcaResult(String(detail));
                if (!endNoticeShownRef.current) {
                    appendLive(`RCA failed: ${compactText(detail, 320)}`);
                    endNoticeShownRef.current = true;
                }
                addChat("assistant", `The RCA run failed: ${compactText(detail, 180)}`);
                loadSessionHistory();
                return;
            }
            if (eventName === "final") {
                const finalMessage = payload.message || ((_e = (_d = payload.session) === null || _d === void 0 ? void 0 : _d.output) === null || _e === void 0 ? void 0 : _e.finalMessage) || "";
                const failureDetail = payload.stderr || ((_g = (_f = payload.session) === null || _f === void 0 ? void 0 : _f.output) === null || _g === void 0 ? void 0 : _g.stderr) || payload.error || "";
                const completed = ((_h = payload.session) === null || _h === void 0 ? void 0 : _h.status) === "completed";
                const stopped = ["cancelled", "stopped", "interrupted"].includes(String(((_j = payload.session) === null || _j === void 0 ? void 0 : _j.status) || "").toLowerCase());
                const summary = buildCompressedRcaResult(payload);
                if (failureDetail) {
                    lastFailureDetailRef.current = String(failureDetail);
                }
                if (payload.sessionId || ((_k = payload.session) === null || _k === void 0 ? void 0 : _k.id)) {
                    setSelectedHistoryId(payload.sessionId || ((_l = payload.session) === null || _l === void 0 ? void 0 : _l.id) || "");
                }
                setAdvancedAnalysis(completed ? (buildAdvancedAnalysis(payload) || finalMessage) : finalMessage);
                setRcaResult(summary
                    || finalMessage
                    || failureDetail
                    || (completed
                        ? "RCA completed. Open Advanced Analysis for the full output."
                        : stopped
                            ? "RCA stopped: the active run was cancelled before completion."
                            : "RCA failed. Check Live Output for the failure detail."));
                setRunState(completed ? "completed" : stopped ? "stopped" : "failed");
                setStatusText(completed ? "Completed" : stopped ? "Stopped" : "Failed");
                if (!endNoticeShownRef.current) {
                    appendLive(completed
                        ? "RCA successful: check RCA Result for the summary."
                        : stopped
                            ? "RCA stopped: the active run was cancelled before completion."
                            : `RCA failed: ${compactText(failureDetail || finalMessage || "The run ended before a completed RCA was produced.", 320)}`);
                    endNoticeShownRef.current = true;
                }
                addChat("assistant", completed
                    ? "RCA completed. The summary is ready."
                    : stopped
                        ? "The RCA run was stopped."
                        : "The RCA run failed. Check Live Output for the failure detail.");
                loadSessionHistory();
                return;
            }
            if (eventName === "done") {
                const ok = payload.status === "completed" || payload.code === 0;
                const stopped = payload.status === "cancelled";
                setRunState(ok ? "completed" : stopped ? "stopped" : "failed");
                setStatusText(ok ? "Completed" : stopped ? "Stopped" : "Failed");
                if (!endNoticeShownRef.current) {
                    const failureDetail = payload.error || payload.message || lastFailureDetailRef.current || "";
                    appendLive(ok
                        ? "RCA successful: check RCA Result for the summary."
                        : stopped
                            ? "RCA stopped: the active run was cancelled before completion."
                            : `RCA failed: ${compactText(failureDetail || `Process exited with code ${(_m = payload.code) !== null && _m !== void 0 ? _m : "unknown"}.`, 320)}`);
                    endNoticeShownRef.current = true;
                }
            }
        }
        return ((0, jsx_runtime_1.jsxs)("div", { class: "rca-app-shell", children: [(0, jsx_runtime_1.jsxs)("header", { class: "rca-topbar", children: [(0, jsx_runtime_1.jsxs)("div", { class: "rca-brand", children: [(0, jsx_runtime_1.jsx)("img", { src: "styles/images/oracle_logo.svg", alt: "Oracle" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { children: appName }), (0, jsx_runtime_1.jsx)("p", { children: "Issue Investigation Tool" })] })] }), (0, jsx_runtime_1.jsxs)("div", { class: "rca-top-actions", children: [(0, jsx_runtime_1.jsxs)("div", { class: "status-chip user-chip", title: signedInLabel, children: [(0, jsx_runtime_1.jsx)("span", { children: "Signed in" }), (0, jsx_runtime_1.jsx)("strong", { children: signedInLabel })] }), (0, jsx_runtime_1.jsxs)("div", { class: `status-chip ${runtime.connected ? "is-ok" : "is-bad"}`, children: [(0, jsx_runtime_1.jsx)("span", { children: "Server Agent" }), (0, jsx_runtime_1.jsx)("strong", { children: isLoadingConfig ? "Checking" : runtime.connected ? "Connected" : "Offline" })] }), (0, jsx_runtime_1.jsxs)("div", { class: `status-chip active-users-chip ${activeUsersData.open ? "is-open" : ""}`, title: "Click to see who is online", onClick: () => setActiveUsersData((previous) => (Object.assign(Object.assign({}, previous), { open: !previous.open }))), children: [(0, jsx_runtime_1.jsx)("span", { children: "Live" }), (0, jsx_runtime_1.jsxs)("strong", { children: [activeUsersData.count, " online"] }), activeUsersData.open ? ((0, jsx_runtime_1.jsxs)("div", { class: "active-users-dropdown", onClick: (event) => event.stopPropagation(), children: [(0, jsx_runtime_1.jsx)("div", { class: "active-users-dropdown-title", children: "Users online now" }), activeUsersData.users.length ? activeUsersData.users.map((user) => ((0, jsx_runtime_1.jsxs)("div", { class: "active-users-item", children: [(0, jsx_runtime_1.jsx)("span", { class: "active-users-dot" }), (0, jsx_runtime_1.jsx)("span", { children: user.name || user.username || "Unknown" })] }))) : ((0, jsx_runtime_1.jsx)("div", { class: "active-users-empty", children: "No users detected yet" }))] })) : null] }), (0, jsx_runtime_1.jsxs)("a", { class: "status-chip signout-button", href: "/auth/logout", children: [(0, jsx_runtime_1.jsx)("span", { children: "Session" }), (0, jsx_runtime_1.jsx)("strong", { children: "Sign out" })] })] })] }), (0, jsx_runtime_1.jsxs)("main", { class: `rca-layout ${leftPanelCollapsed ? "left-collapsed" : ""}`, children: [leftPanelCollapsed ? ((0, jsx_runtime_1.jsx)("aside", { class: "collapsed-rail", "aria-label": "Open investigation panel", children: (0, jsx_runtime_1.jsxs)("button", { class: "rail-menu-button", type: "button", "aria-label": "Open investigation panel", title: "Open investigation panel", onClick: () => setLeftPanelCollapsed(false), children: [(0, jsx_runtime_1.jsx)("span", {}), (0, jsx_runtime_1.jsx)("span", {}), (0, jsx_runtime_1.jsx)("span", {})] }) })) : null, (0, jsx_runtime_1.jsxs)("aside", { class: "control-panel", "aria-label": "Investigation controls and chat", "aria-hidden": leftPanelCollapsed ? "true" : "false", children: [(0, jsx_runtime_1.jsxs)("div", { class: "panel-command-bar", children: [(0, jsx_runtime_1.jsx)("div", { class: "panel-oracle-tile", "aria-label": "Oracle Restaurants RCA panel", children: (0, jsx_runtime_1.jsx)("span", { "aria-hidden": "true" }) }), (0, jsx_runtime_1.jsxs)("button", { class: "panel-collapse-button", type: "button", "aria-label": "Collapse investigation panel", title: "Collapse investigation panel", onClick: () => setLeftPanelCollapsed(true), children: [(0, jsx_runtime_1.jsx)("span", {}), (0, jsx_runtime_1.jsx)("span", {}), (0, jsx_runtime_1.jsx)("span", {})] })] }), (0, jsx_runtime_1.jsxs)("section", { class: "control-card", children: [(0, jsx_runtime_1.jsxs)("div", { class: "section-heading", children: [(0, jsx_runtime_1.jsx)("span", { children: "Mode" }), (0, jsx_runtime_1.jsx)("strong", { children: "Source" })] }), (0, jsx_runtime_1.jsxs)("div", { class: "radio-row two-col", role: "radiogroup", "aria-label": "Developer mode", children: [(0, jsx_runtime_1.jsxs)("label", { children: [(0, jsx_runtime_1.jsx)("input", { type: "radio", name: "developerMode", checked: !developerMode, onChange: () => setDeveloperMode(false) }), "Product"] }), (0, jsx_runtime_1.jsxs)("label", { children: [(0, jsx_runtime_1.jsx)("input", { type: "radio", name: "developerMode", checked: developerMode, onChange: () => setDeveloperMode(true) }), "Developer"] })] }), !developerMode ? ((0, jsx_runtime_1.jsxs)("label", { class: "field-block", children: [(0, jsx_runtime_1.jsx)("span", { children: "Product name" }), (0, jsx_runtime_1.jsx)("select", { value: selectedProduct, onChange: (event) => setSelectedProduct(event.currentTarget.value), children: products.map((product) => ((0, jsx_runtime_1.jsx)("option", { value: product.key, children: product.label }))) })] })) : ((0, jsx_runtime_1.jsxs)("div", { class: "browse-workspace-block", children: [(0, jsx_runtime_1.jsx)("button", { class: "browse-button", type: "button", disabled: isBrowsingWorkspace || !localAgentStatus.connected, onClick: browseWorkspace, children: isBrowsingWorkspace ? "Opening..." : "Browse Code Folder" }), (0, jsx_runtime_1.jsx)("p", { class: `selected-path ${folderPath ? "" : "needs-attention"}`, children: folderPath || "No folder selected" })] })), developerMode ? ((0, jsx_runtime_1.jsx)("p", { class: `workspace-note ${workspace && localAgentStatus.connected ? "" : "needs-attention"}`, children: !localAgentStatus.connected
                                                ? LOCAL_AGENT_DISCONNECTED_NOTICE
                                                : workspace
                                                    ? "Developer workspace ready on your machine."
                                                    : "Choose the local code folder before starting RCA." })) : null] }), (0, jsx_runtime_1.jsxs)("section", { class: "control-card", children: [(0, jsx_runtime_1.jsxs)("div", { class: "section-heading", children: [(0, jsx_runtime_1.jsx)("span", { children: "Ticket" }), (0, jsx_runtime_1.jsx)("strong", { children: "Bug Source" })] }), (0, jsx_runtime_1.jsxs)("div", { class: "radio-row", role: "radiogroup", "aria-label": "Ticket source", children: [(0, jsx_runtime_1.jsxs)("label", { children: [(0, jsx_runtime_1.jsx)("input", { type: "radio", name: "ticketType", checked: ticketType === "jira", onChange: () => setTicketType("jira") }), "Jira Number"] }), (0, jsx_runtime_1.jsxs)("label", { children: [(0, jsx_runtime_1.jsx)("input", { type: "radio", name: "ticketType", checked: ticketType === "bugdb", onChange: () => setTicketType("bugdb") }), "BugDB Number"] }), (0, jsx_runtime_1.jsxs)("label", { children: [(0, jsx_runtime_1.jsx)("input", { type: "radio", name: "ticketType", checked: ticketType === "description", onChange: () => setTicketType("description") }), "Problem Statement"] })] }), (0, jsx_runtime_1.jsxs)("label", { class: "field-block", children: [(0, jsx_runtime_1.jsx)("span", { children: ticketInputLabel }), isDescriptionTicket ? ((0, jsx_runtime_1.jsx)("textarea", { class: "bug-description-input", rows: 5, placeholder: "Problem Statement", value: bugDescription, onInput: (event) => setBugDescription(event.currentTarget.value) })) : ((0, jsx_runtime_1.jsx)("input", { value: ticketId, onInput: (event) => {
                                                        const value = event.currentTarget.value;
                                                        setTicketId(ticketType === "jira" ? value.toUpperCase() : value);
                                                    }, placeholder: ticketPlaceholder }))] }), (0, jsx_runtime_1.jsxs)("div", { class: "button-row", children: [(0, jsx_runtime_1.jsx)("button", { class: "primary-button", type: "button", disabled: !canRun, title: !canRun ? runDisabledReason : runButtonLabel, onClick: startRun, children: runButtonLabel }), (0, jsx_runtime_1.jsx)("button", { class: "secondary-button", type: "button", disabled: runState !== "running", onClick: stopRun, children: "Stop" })] }), !canRun && runDisabledReason ? (0, jsx_runtime_1.jsx)("p", { class: "run-disabled-note", children: runDisabledReason }) : null] }), (0, jsx_runtime_1.jsxs)("section", { class: "control-card chat-card", children: [(0, jsx_runtime_1.jsx)("div", { class: "section-heading", children: (0, jsx_runtime_1.jsx)("span", { children: "Chat history" }) }), (0, jsx_runtime_1.jsx)("div", { class: "session-history-list", children: sessionHistory.length ? sessionHistory.map((session) => ((0, jsx_runtime_1.jsxs)("article", { class: `session-history-item ${selectedHistoryId === session.id ? "is-selected" : ""}`.trim(), role: "button", tabIndex: 0, title: formatSessionHistoryTitle(session), onClick: () => openHistorySession(session.id), onKeyDown: (event) => {
                                                    if (event.key === "Enter" || event.key === " ") {
                                                        event.preventDefault();
                                                        openHistorySession(session.id);
                                                    }
                                                }, children: [(0, jsx_runtime_1.jsx)("div", { class: "session-history-title", children: formatSessionHistoryTitle(session) }), (0, jsx_runtime_1.jsx)("button", { class: "session-delete-button", type: "button", "aria-label": `Delete ${formatSessionHistoryTitle(session)}`, title: "Delete", disabled: deletingSessionId === session.id || session.status === "running", onClick: (event) => {
                                                            event.stopPropagation();
                                                            deleteHistorySession(session.id);
                                                        } })] }))) : ((0, jsx_runtime_1.jsx)("p", { class: "muted", children: "No saved chats yet." })) })] })] }), (0, jsx_runtime_1.jsxs)("section", { class: "work-panel", children: [(0, jsx_runtime_1.jsxs)("nav", { class: "view-tabs", "aria-label": "RCA workspace views", children: [(0, jsx_runtime_1.jsx)("button", { class: activeView === "workspace" ? "active" : "", type: "button", onClick: () => setActiveView("workspace"), children: "RCA Workspace" }), (0, jsx_runtime_1.jsx)("button", { class: activeView === "advanced" ? "active" : "", type: "button", disabled: !advancedEnabled, onClick: () => setActiveView("advanced"), children: "Advanced Analysis" })] }), activeView === "workspace" ? ((0, jsx_runtime_1.jsxs)("div", { class: "analysis-grid", children: [(0, jsx_runtime_1.jsxs)("section", { class: "live-output-panel", children: [(0, jsx_runtime_1.jsxs)("div", { class: "panel-title", children: [(0, jsx_runtime_1.jsx)("h2", { children: "Live Output" }), (0, jsx_runtime_1.jsxs)("span", { children: [liveOutput.length, " lines"] })] }), (0, jsx_runtime_1.jsxs)("div", { class: "terminal-surface", ref: liveOutputRef, children: [(0, jsx_runtime_1.jsx)("div", { class: "run-context-block", children: contextLines.map((line) => (0, jsx_runtime_1.jsx)("p", { children: line })) }), liveOutput.length ? liveOutput.map((line) => renderLiveLine(line)) : ((0, jsx_runtime_1.jsxs)("div", { class: "empty-state", children: [(0, jsx_runtime_1.jsx)("strong", { children: "No run started" }), (0, jsx_runtime_1.jsx)("span", { children: "Choose source and start RCA to stream Codex output here." })] })), runState === "running" ? ((0, jsx_runtime_1.jsxs)("p", { class: "live-output-wait-cursor", "aria-live": "polite", children: [(0, jsx_runtime_1.jsx)("span", { children: "Processing" }), (0, jsx_runtime_1.jsxs)("span", { class: "wait-dots", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("span", {}), (0, jsx_runtime_1.jsx)("span", {}), (0, jsx_runtime_1.jsx)("span", {})] })] })) : null] })] }), (0, jsx_runtime_1.jsxs)("section", { class: "rca-result-panel", children: [(0, jsx_runtime_1.jsxs)("div", { class: "panel-title", children: [(0, jsx_runtime_1.jsx)("h2", { children: "RCA Result" }), runState !== "idle" ? ((0, jsx_runtime_1.jsx)("span", { children: runState === "completed" ? "Ready" : runState === "failed" ? "Failed" : runState === "stopped" ? "Stopped" : "Waiting" })) : null] }), (0, jsx_runtime_1.jsx)("div", { class: "result-surface", children: rcaResult ? parseRcaResultSections(rcaResult).map((section) => ((0, jsx_runtime_1.jsxs)("article", { class: `rca-result-section ${getRcaSectionClass(section.heading, section.body)}`.trim(), children: [(0, jsx_runtime_1.jsx)("h3", { children: section.heading }), section.body ? renderRichText(section.body, "rca-result") : null] }))) : (0, jsx_runtime_1.jsx)("p", { class: "muted", children: "The RCA summary will appear here after Codex completes analysis." }) })] })] })) : ((0, jsx_runtime_1.jsxs)("section", { class: "advanced-panel", children: [(0, jsx_runtime_1.jsxs)("div", { class: "panel-title", children: [(0, jsx_runtime_1.jsx)("h2", { children: "Advanced Analysis" }), (0, jsx_runtime_1.jsx)("span", { children: "Full output" })] }), (0, jsx_runtime_1.jsx)("div", { class: "advanced-output", children: renderRichText(advancedAnalysis || "Advanced Analysis unlocks after RCA completion.", "advanced") })] }))] })] })] }));
    }, "App", { "properties": { "appName": { "type": "string" }, "userLogin": { "type": "string" } } }, { "appName": "Oracle Restaurants RCA", "userLogin": "Signed in" });
});

define('index',["require","exports","./components/app"],(function(require,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0})}));
/**
 * @license
 * Copyright (c) 2014, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
requirejs.config({baseUrl:".",paths:{knockout:"libs/knockout/knockout-3.5.1",jquery:"libs/jquery/jquery-3.7.1.min","jqueryui-amd":"libs/jquery/jqueryui-amd-1.14.1.min",hammerjs:"libs/hammer/hammer-2.0.8.min",ojdnd:"libs/dnd-polyfill/dnd-polyfill-1.0.2.min",ojs:"libs/oj/19.0.6/min",ojL10n:"libs/oj/19.0.6/ojL10n",ojtranslations:"libs/oj/19.0.6/resources","@oracle/oraclejet-preact":"libs/oraclejet-preact/amd","oj-c":"libs/packs/oj-c/min",persist:"libs/persist/min",text:"libs/require/text",signals:"libs/js-signals/signals.min",touchr:"libs/touchr/touchr",preact:"libs/preact/dist/preact.umd","preact/hooks":"libs/preact/hooks/dist/hooks.umd","preact/compat":"libs/preact/compat/dist/compat.umd","preact/jsx-runtime":"libs/preact/jsx-runtime/dist/jsxRuntime.umd","preact/debug":"libs/preact/debug/dist/debug.umd","preact/devtools":"libs/preact/devtools/dist/devtools.umd",proj4:"libs/proj4js/dist/proj4",css:"libs/require-css/css.min",ojcss:"libs/oj/19.0.6/min/ojcss","ojs/ojcss":"libs/oj/19.0.6/min/ojcss",chai:"libs/chai/chai","css-builder":"libs/require-css/css-builder",normalize:"libs/require-css/normalize","ojs/normalize":"libs/require-css/normalize",components:"components"}}),require(["./index"]);
define("bundle-temp", function(){});


(function(c){var d=document,a='appendChild',i='styleSheet',s=d.createElement('style');s.type='text/css';d.getElementsByTagName('head')[0][a](s);s[i]?s[i].cssText=c:s[a](d.createTextNode(c));})
('.LayerHostStyles_baseStyle__f93kxw0 {\n  position: absolute;\n  left: 0;\n  right: 0;\n  top: 0;\n}.LayerStyles_baseStyle__g9p4b90 {\n  position: relative;\n}\n.LayerStyles_tooltipPriorityStyle__g9p4b91 {\n  z-index: 800;\n}\n.LayerStyles_popupPriorityStyle__g9p4b92 {\n  z-index: 1000;\n}\n.LayerStyles_dialogPriorityStyle__g9p4b93 {\n  z-index: 1050;\n}\n.LayerStyles_messagesPriorityStyle__g9p4b94 {\n  z-index: 2000;\n}');
