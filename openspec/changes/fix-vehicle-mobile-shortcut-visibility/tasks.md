## 1. Vehicle edit behavior

- [x] 1.1 Review the vehicle edit page mobile shortcut condition and normalize the visibility check so the button only appears when `userStore.userData.mobile` is usable.
- [x] 1.2 Preserve manual phone input behavior when the shortcut is hidden and ensure the shortcut still fills the phone field when shown.

## 2. Verification

- [x] 2.1 Run targeted checks for the touched vehicle edit page file and resolve any issues introduced by the change.
- [ ] 2.2 Manually verify both cases: user profile with mobile shows the shortcut, and user profile without mobile hides it while still allowing manual input.
