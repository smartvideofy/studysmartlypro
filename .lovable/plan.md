

# Fix Oversized Toggle Switches on Mobile

## Problem
The toggle switches in Settings (In-App Notifications, Email Notifications, Dark Mode) look visually heavy and disproportionate on mobile. At 28x48px with a 24px thumb, they dominate the rows and feel clunky compared to premium app standards (iOS uses ~31x51px but with thinner track proportions).

## Solution
Reduce the Switch component dimensions to a more refined size that still meets touch target requirements (the row itself provides the 44px touch area):

- **Track**: `h-6 w-11` (24x44px) -- slightly slimmer, more proportional
- **Thumb**: `h-5 w-5` (20px) -- matches the reduced track
- **Translation**: Adjust `translate-x-5` to `translate-x-[18px]` for correct travel distance

## File Changed
- `src/components/ui/switch.tsx` -- Update track and thumb dimensions

## Visual Impact
The switches will look more refined and balanced within each settings row, closer to what premium apps like Notion or Linear use. The touch target remains accessible since the entire row is tappable.
