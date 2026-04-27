## Why

The vehicle edit page includes a "use current phone number" shortcut that should only appear when the current user profile already has a mobile number. This rule needs to be explicit so the page does not show an unusable shortcut for users whose `userData.mobile` is empty or missing.

## What Changes

- Clarify the vehicle edit page behavior for the phone shortcut button.
- Require the shortcut button to be hidden when `userStore.userData.mobile` is empty, undefined, or otherwise unavailable.
- Preserve manual phone input regardless of whether the shortcut is shown.

## Capabilities

### New Capabilities

- `vehicle-phone-shortcut-visibility`: Covers conditional display of the vehicle edit page phone shortcut based on the current user profile mobile value.

### Modified Capabilities

None.

## Impact

- Affected code is primarily `src/pages_client/pages/user/vehicle/edit/index.vue` and any related user-store access used by that page.
- No API or dependency changes are expected.
