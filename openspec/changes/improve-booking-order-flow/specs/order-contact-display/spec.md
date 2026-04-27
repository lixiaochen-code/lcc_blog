## ADDED Requirements

### Requirement: Order detail shows owner salutation and phone

The system SHALL display the order-level owner salutation (`callName`) and phone number in the order detail page so the service team and customer can confirm the booked contact identity.

#### Scenario: Render order detail with owner contact information

- **WHEN** an order detail response includes `callName` and `phone`
- **THEN** the order detail page shows both values in the order information area

#### Scenario: Render historical order detail without new fields

- **WHEN** an order detail response does not include `callName` or `phone`
- **THEN** the order detail page renders safely with fallback placeholders instead of failing

### Requirement: Todo cards show owner contact information needed for fulfillment

The system SHALL expose owner contact information in staff-facing todo views so staff and managers can identify the owner by license plate, salutation, and phone number.

#### Scenario: Render todo item with owner contact information

- **WHEN** a todo item includes license plate, `callName`, and `phone`
- **THEN** the todo card shows all three values in a readable format

#### Scenario: Render todo item with partial legacy data

- **WHEN** a todo item is missing `callName` or `phone`
- **THEN** the todo card still renders the available information without breaking layout or navigation

### Requirement: Downstream order views de-emphasize brand-model-color metadata

The system SHALL prioritize license plate and owner contact identity over vehicle brand, model, and color in downstream order surfaces affected by this change.

#### Scenario: View order identity information after booking

- **WHEN** a user or staff member opens an order surface updated by this change
- **THEN** the system presents license plate and owner contact information as the primary identity data for the order
