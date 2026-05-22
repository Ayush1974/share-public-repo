define(["require", "exports", "preact/jsx-runtime", "preact/hooks", "ojs/ojresponsiveutils", "ojs/ojtoolbar", "ojs/ojmenu", "ojs/ojbutton"], function (require, exports, jsx_runtime_1, hooks_1, ResponsiveUtils) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Header = Header;
    function Header({ appName, userLogin }) {
        const mediaQueryRef = (0, hooks_1.useRef)(window.matchMedia(ResponsiveUtils.getFrameworkQuery("sm-only")));
        const [isSmallWidth, setIsSmallWidth] = (0, hooks_1.useState)(mediaQueryRef.current.matches);
        (0, hooks_1.useEffect)(() => {
            mediaQueryRef.current.addEventListener("change", handleMediaQueryChange);
            return (() => mediaQueryRef.current.removeEventListener("change", handleMediaQueryChange));
        }, [mediaQueryRef]);
        function handleMediaQueryChange(e) {
            setIsSmallWidth(e.matches);
        }
        function getDisplayType() {
            return (isSmallWidth ? "icons" : "all");
        }
        ;
        function getEndIconClass() {
            return (isSmallWidth ? "oj-icon demo-appheader-avatar" : "oj-component-icon oj-button-menu-dropdown-icon");
        }
        return ((0, jsx_runtime_1.jsx)("header", { role: "banner", class: "oj-web-applayout-header", children: (0, jsx_runtime_1.jsxs)("div", { class: "oj-web-applayout-max-width oj-flex-bar oj-sm-align-items-center", children: [(0, jsx_runtime_1.jsxs)("div", { class: "oj-flex-bar-middle oj-sm-align-items-baseline", children: [(0, jsx_runtime_1.jsx)("img", { class: "oj-icon demo-oracle-icon", title: "Oracle Logo", alt: "Oracle Logo" }), (0, jsx_runtime_1.jsx)("h1", { class: "oj-sm-only-hide oj-web-applayout-header-title", title: "Application Name", children: appName })] }), (0, jsx_runtime_1.jsx)("div", { class: "oj-flex-bar-end", children: (0, jsx_runtime_1.jsx)("oj-toolbar", { children: (0, jsx_runtime_1.jsxs)("oj-menu-button", { id: "userMenu", display: getDisplayType(), chroming: "borderless", children: [(0, jsx_runtime_1.jsx)("span", { children: userLogin }), (0, jsx_runtime_1.jsx)("span", { slot: "endIcon", class: getEndIconClass() }), (0, jsx_runtime_1.jsxs)("oj-menu", { id: "menu1", slot: "menu", children: [(0, jsx_runtime_1.jsx)("oj-option", { id: "pref", value: "pref", children: "Preferences" }), (0, jsx_runtime_1.jsx)("oj-option", { id: "help", value: "help", children: "Help" }), (0, jsx_runtime_1.jsx)("oj-option", { id: "about", value: "about", children: "About" }), (0, jsx_runtime_1.jsx)("oj-option", { id: "out", value: "out", children: "Sign Out" })] })] }) }) })] }) }));
    }
});
