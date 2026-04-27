## ADDED Requirements

### Requirement: Booking page shows inline single-select payment options

The system SHALL present the booking payment methods directly in the booking page as mutually exclusive single-select options instead of a select or action-sheet interaction.

#### Scenario: View payment options on the booking page

- **WHEN** the booking page loads
- **THEN** the system displays the supported payment methods inline with the current selection visible

#### Scenario: Change payment method

- **WHEN** a user taps a different payment option
- **THEN** the system updates the selected payment method immediately and keeps exactly one option selected

### Requirement: Booking vehicle picker supports editing saved vehicles

The system SHALL provide an edit action for each saved vehicle in the booking vehicle picker so users can modify vehicle details without leaving the booking flow entirely.

#### Scenario: Edit a saved vehicle from the picker

- **WHEN** a user taps the edit action for a vehicle in the picker
- **THEN** the system navigates to the vehicle edit page for that specific vehicle

#### Scenario: Edit action does not select the vehicle row

- **WHEN** a user taps the vehicle edit action
- **THEN** the system MUST NOT also trigger the vehicle selection handler for that row

### Requirement: Booking page captures owner contact identity

The system SHALL collect `licensePlate`, `callName`, and `phone` in the booking flow and SHALL treat all three fields as required before order submission.

#### Scenario: Submit booking with missing required identity fields

- **WHEN** any of `licensePlate`, `callName`, or `phone` is missing at submission time
- **THEN** the system blocks submission and shows a validation message for the missing information

#### Scenario: Submit booking with complete identity fields

- **WHEN** `licensePlate`, `callName`, and `phone` are all present along with the existing booking prerequisites
- **THEN** the system includes those values in the order submission payload

### Requirement: Booking page hides nonessential vehicle metadata

The system SHALL prioritize displaying vehicle license plate and owner contact identity in the booking flow and MUST NOT require brand, model, or color to be shown as primary booking information.

#### Scenario: Display selected vehicle on booking page

- **WHEN** a vehicle is selected for booking
- **THEN** the system shows the license plate as the key vehicle identifier without requiring brand, model, or color in the visible summary

#### Scenario: Display vehicles inside the picker

- **WHEN** the vehicle picker renders saved vehicles
- **THEN** the system keeps the selection UI understandable even if brand, model, and color are hidden or deemphasized
