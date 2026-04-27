## Why

The current client booking flow still blocks users at several high-frequency steps: the home page banner cannot be viewed full-screen, the booking page uses an extra action sheet for payment selection, the recommend-card "book now" action can still trigger parent click behavior unexpectedly, and users cannot edit a vehicle while selecting it for an order. The order information shown across booking, order detail, and staff todo views also does not match the latest business requirement to prioritize license plate and contact identity over brand/model/color.

## What Changes

- Add full-screen preview for home page carousel images.
- Fix the bubbling issue on the home recommendation "立即预约" action so booking always follows the button intent.
- Replace booking-page payment selection via action sheet with inline single-select options.
- Allow users to edit an existing vehicle from the booking page vehicle picker.
- Adjust booking-page vehicle display to hide brand, model, and color, and collect `callName` plus `phone` alongside the required license plate.
- Make `licensePlate`, `callName`, and `phone` required for submitting a booking.
- Show `callName` and `phone` in order detail and staff/manager todo surfaces so service staff can identify and contact the owner quickly.

## Capabilities

### New Capabilities

- `client-home-service-entry`: Covers home carousel full-screen preview and the corrected booking entry behavior from recommendation cards.
- `client-booking-form`: Covers payment single-select interaction, vehicle picker editing, booking contact fields, hidden vehicle metadata, and required-field validation.
- `order-contact-display`: Covers the order detail and staff/manager todo presentation of owner salutation and phone information.

### Modified Capabilities

None.

## Impact

- Affected code will include the client home page banner/recommendation components, the client booking page, vehicle selection UI, order detail page, staff home page, manager home page, and related order/vehicle TypeScript interfaces.
- API request and response models may need to carry `callName` and `phone` consistently through order creation, order detail, and todo list data.
- No new external dependencies are expected.
