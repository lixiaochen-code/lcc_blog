## ADDED Requirements

### Requirement: Vehicle phone shortcut only appears when current mobile exists

The system SHALL show the vehicle edit page phone shortcut button only when the current user profile provides a usable `userData.mobile` value.

#### Scenario: Current user has a mobile number

- **WHEN** the vehicle edit page loads and `userStore.userData.mobile` contains a usable mobile number
- **THEN** the page shows the shortcut button for filling the current phone number

#### Scenario: Current user has no mobile number

- **WHEN** the vehicle edit page loads and `userStore.userData.mobile` is empty, undefined, or otherwise unavailable
- **THEN** the page MUST NOT display the shortcut button

### Requirement: Manual phone entry remains available without shortcut

The system SHALL keep the phone input field editable even when the shortcut button is hidden.

#### Scenario: Enter phone manually without stored mobile

- **WHEN** the vehicle edit page hides the shortcut button because no current mobile exists
- **THEN** the user can still type a phone number into the phone input and submit after existing validation passes
