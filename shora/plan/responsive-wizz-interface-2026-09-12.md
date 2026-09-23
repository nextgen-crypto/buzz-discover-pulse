# Responsive WIZZ interface

## What will change
- Make the shared page frame fluid: phone-first, wider on tablets and desktops, while keeping readable content widths.
- Keep the bottom navigation stable across narrow phones, safe areas, and short screens without clipped labels or controls.
- Adapt Home, News, Videos, Profile, follower lists, and public profiles with responsive spacing, columns, and media sizing.
- Keep Shorts full-screen, but constrain its content and controls safely on wide and short displays.
- Restore the visible **WIZZ** title and give it a dedicated black title color in light and dark appearance modes.
- Ensure expandable panels use the available viewport safely on phones, tablets, and desktops.

## Validation
- Check the main pages at phone, tablet, and desktop viewport sizes.
- Confirm navigation, text, images, panels, and the WIZZ title do not overflow or distort.
- Confirm the project builds without errors.

## Technical details
- Use responsive Tailwind layout utilities and semantic design tokens.
- Preserve existing data, authentication, actions, and page behavior.
- Keep image/video aspect ratios with `object-cover` and bounded responsive containers.
