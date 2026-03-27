# InvenTree API Schema Tracker (OpenAPI Verified)

This document tracks the official InvenTree API schema as defined in the OpenAPI 3.0 specification.

## Build Orders (`/api/build/`)

### 1. List Build Orders

- **Path**: `GET /api/build/`
- **Response**: `PaginatedBuildList` (paginated `results` array of `Build` objects)
- **Key Query Params**: `part_detail=true` (default), `active`, `status`, `part`

### 2. Retrieve Build Order

- **Path**: `GET /api/build/{id}/`
- **Response**: `Build` object

### 3. Issue Build Order (Start Run)

- **Path**: `POST /api/build/{id}/issue/`
- **Description**: Marks a BuildOrder as active/issued.
- **Response**: `201 Created` (No body)

### 4. Finish Build Order (Complete)

- **Path**: `POST /api/build/{id}/finish/`
- **Description**: Marks a build as finished/completed.
- **Body**: `BuildComplete` object
  - `accept_overallocated`: String Enum (`reject`, `accept`, `trim`)
  - `accept_unallocated`: Boolean
  - `accept_incomplete`: Boolean

### 5. Create Build Output

- **Path**: `POST /api/build/{id}/create-output/`
- **Body**: `BuildOutputCreate` object
  - `quantity`: Number (Required)
  - `batch_code`: String
  - `serial_numbers`: String
  - `location`: Integer
  - `auto_allocate`: Boolean

## Build Line Items (BOM) (`/api/build/line/`)

### List BOM Lines

- **Path**: `GET /api/build/line/`
- **Query Params**: `build` (Required), `part_detail=true`
- **Response**: `PaginatedBuildLineList` (results array of `BuildLine` objects)

## Data Models (Mapped)

### Build Object

| Field       | Type    | API Source                                                                       |
| :---------- | :------ | :------------------------------------------------------------------------------- |
| `id`        | String  | `pk`                                                                             |
| `reference` | String  | `reference`                                                                      |
| `partId`    | Integer | `part`                                                                           |
| `partName`  | String  | `part_detail.full_name` or `part_name`                                           |
| `status`    | Integer | `status` (10: Pending, 20: Production, 25: On Hold, 30: Cancelled, 40: Complete) |
| `built`     | Number  | `completed`                                                                      |
| `target`    | Number  | `quantity`                                                                       |

### Build Line (BOM)

| Field       | Type    | API Source  |
| :---------- | :------ | :---------- |
| `id`        | String  | `pk`        |
| `partId`    | Integer | `part`      |
| `required`  | Number  | `quantity`  |
| `allocated` | Number  | `allocated` |
| `consumed`  | Number  | `consumed`  |
