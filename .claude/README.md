What Fixed It
The issue was GHL's container constraints. GoHighLevel wraps custom code elements in containers with max-widths and padding. We fixed it by:

Overriding all parent containers - Removed padding/margins from all GHL wrapper elements
Breaking out of the container - Used the "viewport width trick":

css   width: 100vw;
   left: 50%;
   right: 50%;
   margin-left: -50vw;
   margin-right: -50vw;
This forces the iframe to ignore its parent's width and span the full screen.

Instructions for Claude: How to Embed Full-Width iFrames in GoHighLevel
When a user needs to embed an external page via iframe in GoHighLevel and make it truly full-width:
The Problem

GHL wraps custom code in containers with max-widths (typically 1200px) and padding
Standard iframe width: 100% only fills the container, not the full viewport
Fixed position elements (like nav) may work, but normal content gets constrained

The Solution
Provide this code template:
html<style>
/* Override ALL GHL containers */
body,
.hl_page-preview--content,
.hl_page-preview--content > div,
.custom-code-element,
section,
.container,
[class*="container"],
[class*="wrapper"] {
    max-width: 100% !important;
    width: 100% !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
}

/* Full-width iframe - break out of container */
iframe {
    width: 100vw !important;
    min-height: 100vh !important;
    border: none !important;
    display: block !important;
    margin: 0 !important;
    padding: 0 !important;
    position: relative !important;
    left: 50% !important;
    right: 50% !important;
    margin-left: -50vw !important;
    margin-right: -50vw !important;
}
</style>

<iframe 
    src="USER_IFRAME_URL_HERE" 
    frameborder="0"
></iframe>
Key Techniques Explained

!important flags - Override GHL's CSS specificity
100vw width - Use viewport width, not parent container width
Negative margin technique - left: 50%; margin-left: -50vw; pulls the iframe back to screen edges
Remove all padding - Target multiple container classes to catch all GHL wrappers

Additional Tips for Users

In GHL section settings, set Section Width to "Full Width" if available
Set all padding to 0 in section settings
Use Custom Code element, not HTML element
Test on mobile after implementation

When This Approach Works Best

Embedding external landing pages
Full-screen applications
When you need complete control over layout without GHL constraints
When the embedded content has its own navigation and full-page design
