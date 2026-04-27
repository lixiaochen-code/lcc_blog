## ADDED Requirements

### Requirement: Home banners support full-screen preview

The system SHALL allow users to open home page banner images in a full-screen image preview using the currently loaded banner image list.

#### Scenario: Preview a banner from the home page

- **WHEN** a user taps a banner image on the home page
- **THEN** the system opens a full-screen preview starting from the tapped banner image

#### Scenario: Ignore empty banner images safely

- **WHEN** a banner item has no usable image URL
- **THEN** the system MUST NOT trigger a broken preview action for that item

### Requirement: Recommendation booking CTA follows button intent only

The system SHALL treat the recommendation-card "立即预约" button as an isolated booking action and MUST NOT trigger duplicate or unintended parent click behavior when the button is pressed.

#### Scenario: Tap the booking button inside a recommendation card

- **WHEN** a user taps the "立即预约" button on a recommendation card
- **THEN** the system navigates once to the corresponding booking entry flow for that service

#### Scenario: Tap elsewhere on the recommendation card

- **WHEN** a user taps a non-button area of a recommendation card
- **THEN** the system performs the card-level navigation behavior without depending on the button handler
