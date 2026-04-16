# Ezvento — Product Requirements Draft

Ezvento is a cloud POS + inventory SaaS for small to mid-sized Indian businesses. It should feel simple enough for a first-time shop user, but powerful enough to support growing retail operations with multiple stores, multiple billing counters, inventory movement, customer credit, and subscription-based access control.

The product promise is: **“Simplifying how you run your store.”**

## Product intent

Ezvento should solve the daily operating problems of retail businesses:

- bill customers fast
- track stock across stores and counters
- manage staff with simple permissions
- support credit/udhar and customer history
- handle payments cleanly, including UPI, card, cash, and split payment
- let the owner see the whole business in one place
- work with low-tech users and weak internet conditions
- stay easy to set up and easy to learn

This is not just billing software. It is the operating layer for a shop.

## Target users

The system should support these core personas:

- **Owner**: creates the business, chooses plan, manages stores, sees performance, controls access
- **Store Manager**: manages one or more stores, inventory, counters, staff, and daily operations
- **Billing Staff / Cashier**: logs in, bills quickly, takes payments, prints receipts, handles simple corrections
- **Inventory Staff**: receives stock, transfers stock, audits stock, updates product details when allowed
- **Customer**: indirect user who may appear in receipts, loyalty, or credit history

The UX should assume that many users are not highly technical. The interface must be obvious, forgiving, and fast.

## Product structure

At the highest level, the hierarchy is:

**Organization → Stores → Counters → Users / Inventory / Sales / Customers**

### Organization
Represents one business account. A single organization can own multiple stores.

### Store
A physical branch or outlet. Stores can have their own inventory, managers, counters, and performance reporting.

### Counter
A billing station inside a store. A store can have one or many counters. Each counter may have its own assigned cashier and session.

### Inventory location
A stock-bearing location. This may be a store floor stock, backroom, warehouse, or another named location. Stock must be movable between locations.

### Users
People who log into the system. Access must be role-based and limited by the subscription plan.

## Onboarding and setup

Setup should be fast enough that a business can sign up, pay, enter basic details, and start operating with minimal help.

The onboarding flow should be:

1. sign up
2. verify phone/email
3. choose industry
4. choose plan
5. enter business details
6. choose number of stores, counters, and users
7. define roles / personas
8. complete payment
9. land in a ready-to-use dashboard and POS screen

The product should support **industry-based setup**, because the same words do not work for every shop.

Examples:
- grocery: loose items, units, weights, fast barcode entry, low-stock alerts
- pharmacy: batch number, expiry, dosage, compliance fields
- clothing: size, color, variant handling
- electronics: warranty, serial number, accessories
- general retail: flexible catalog and pricing

The system should auto-create sensible defaults based on industry and selected plan.

## Billing / POS behavior

The POS must be the fastest part of the product.

The billing screen should support:
- barcode scanning
- manual item search
- quick item add if the product is missing
- editable quantity
- discounts if permitted
- tax calculation
- total amount and payment status
- print receipt
- customer-facing display with only the necessary details
- bill hold / resume
- bill cancel / refund

The cashier screen should show only what is needed for billing. It should not be cluttered with reports, settings, or admin options.

The customer-facing screen should show:
- store name
- items
- quantity
- subtotal
- discount
- tax
- total
- payment status

### Payment support in POS
POS should support:
- cash
- UPI
- card
- split payment
- partial payment
- credit / udhar
- refunds
- void/cancel before completion

For UPI, the system should support a simple India-first flow, including QR display and any future payment provider integrations. For card, the product should support external payment devices or confirmation-only mode if hardware integration is not available yet. The system should never block billing if a particular payment mode is unavailable; it should degrade gracefully.

### Billing rules
- item scan should add the item immediately
- if barcode scan fails, manual lookup must be fast
- if the item is not in inventory, cashier may create a minimal draft item only if allowed
- billed quantity should reduce inventory automatically
- credit sales must be recorded against the customer account
- refunds must restore stock when appropriate
- every bill must have a unique invoice number
- each bill must be linked to store, counter, cashier, and timestamp

## Inventory behavior

Inventory must be able to handle real retail complexity without becoming hard to use.

The system should support:
- multiple stores
- multiple inventory locations
- stock transfers between locations
- receiving stock
- purchase intake
- stock adjustments
- damaged stock
- expired stock
- stock audits / physical count
- low-stock alerts
- products with variants
- batch and expiry where needed
- total stock and location-wise stock views

Stock movement scenarios to support:
- warehouse → store
- store → store
- store → backroom
- backroom → counter stock if needed
- return to supplier
- damaged or written-off stock
- sale-linked stock deduction
- manual correction after audit

The stock model should be able to answer:
- how much of item X exists in the whole business
- how much exists in store A
- how much exists in a specific counter or location
- which batch is closest to expiry
- which items are moving quickly or slowly

## User roles and permissions

The system should be role-based. Common roles:

- Owner
- Manager
- Cashier
- Inventory Staff
- Accountant (optional)
- System Admin (internal only)

Permissions should be configurable, but the defaults should stay simple.

Typical permissions:
- Owner: full access
- Manager: store-level access, staff and inventory control within assigned stores
- Cashier: billing only, limited customer lookup, limited discount access
- Inventory Staff: stock operations, no financial admin access
- Accountant: reports and exports, limited operational edits

The product should also support:
- login with phone/email/password or PIN
- session tracking
- optional shift-based login
- audit logs for important actions
- secure logout and automatic timeout rules

## Customers, credit, and loyalty

The customer module should be practical, not overly complicated.

It should support:
- customer name
- phone number
- purchase history
- notes
- credit balance / udhar
- payment collection history
- optional loyalty points
- optional customer tags

Important flows:
- a sale can be linked to a customer
- a sale can become partial payment or credit
- outstanding balances should remain visible
- cash collection against old dues should be possible
- duplicate customer records should be mergeable
- reminders may be sent later via SMS/WhatsApp/in-app notifications

## Subscription and plan control

Ezvento is a SaaS product. Access must be gated by subscription.

The plan model should support:
- trial
- active subscription
- renewal
- downgrade
- upgrade
- expired subscription
- grace period
- feature gating by plan

Example plan limits:
- number of stores
- number of counters
- number of users
- reporting depth
- advanced inventory features
- credit/loyalty availability
- multi-store control
- hardware integrations
- automation features

The product should never allow a business to exceed plan limits silently. It should clearly prompt for upgrade or disable the extra action with a helpful message.

## Hardware and integrations

The product should be compatible with common retail hardware and software workflows.

Should support:
- barcode scanners
- thermal receipt printers
- cash drawers
- customer display screens
- weighing scales later if needed
- payment confirmation hardware or provider integrations
- export to CSV/PDF
- SMS/WhatsApp notification integration later

Integration strategy:
- start simple
- support manual confirmation where automation is not yet available
- add direct hardware/payment integrations as separate modules
- do not force deep integrations for MVP

## Real-world scenarios the product must handle

The system should be designed for messy retail reality, not just ideal cases.

It should handle:
- barcode does not scan
- item not found during billing
- customer changes mind mid-bill
- network drops during sale
- cash drawer opens but payment fails
- UPI QR payment is delayed
- card payment is approved externally but not reflected instantly
- stock becomes low while billing
- same item is sold from two counters at the same time
- price changes after bill hold
- refund after sale
- exchange instead of refund
- wrong customer linked to a sale
- duplicate customer records
- stock transfer entered wrongly
- damaged or expired stock
- shift not closed properly
- item sold offline and synced later
- invoice reprint requested later
- subscription expires while business is active

Important rule: the system should be able to recover from mistakes without data loss and with an audit trail.

## Offline and sync behavior

Offline support is important.

When internet is unavailable:
- billing should continue
- product catalog should remain usable from cached data
- recent customers and prices should still work
- sales should queue locally
- receipts should still be printable
- sync should resume automatically when connection returns

When syncing:
- the system should avoid duplicates
- the same sale should never post twice
- conflicts should be visible to managers
- inventory and payment events should resolve consistently
- failed sync items should be retryable

The goal is business continuity first, perfect cloud sync second.

## Reporting and visibility

Owners and managers should be able to see useful information without hunting through complicated menus.

Core reports:
- today’s sales
- date-range sales
- store-wise sales
- counter-wise sales
- cashier-wise performance
- item-wise sales
- low-stock items
- stock value
- dues / outstanding credit
- returns and refunds
- payment breakdown by mode
- tax summary
- audit log

Reports should be filterable by date, store, counter, category, and product. Export should be possible where needed.

## UX principles

The product should feel:
- simple
- fast
- calm
- trustworthy
- powerful underneath
- emotional in the sense that it supports the business owner, not just the software task

UI rules:
- use plain words
- keep the billing screen focused
- avoid clutter
- make actions obvious
- prefer large buttons and readable type
- show smart suggestions only when useful
- do not overwhelm low-tech users
- keep labels consistent across industries

Smart assistant behavior:
- suggest low stock
- suggest reorder
- suggest relevant actions when something is missing
- help recover from mistakes
- explain errors in simple language

## Data model concepts

The system will likely need these core entities:

- Organization
- Plan
- Subscription
- Store
- Counter
- Location
- User
- Role
- Permission
- Product
- Product Variant
- Barcode
- Stock Ledger
- Stock Transfer
- Purchase / Stock In
- Sale
- Sale Item
- Payment
- Refund
- Customer
- Credit Ledger
- Shift
- Audit Log
- Notification

A ledger-style approach is recommended for stock and payments so actions are traceable and reversible.

## MVP scope

The first version should focus on the smallest useful system.

MVP should include:
- one organization
- one or more stores
- multiple counters per store
- fast billing
- barcode scan and manual search
- cash / UPI / card / credit recording
- basic inventory
- stock transfer
- customer records
- owner / manager / cashier roles
- simple reports
- subscription gating
- onboarding with industry selection
- customer display support if possible
- offline billing with later sync if feasible

After MVP, expand into:
- stronger multi-store management
- batch and expiry
- advanced reporting
- loyalty
- reminders
- deeper hardware integrations
- more industry templates
- better automation

## Brand direction

Product name: **Ezvento**

Tagline: **Simplifying how you run your store**

Brand personality:
- premium
- powerful
- simple
- emotionally reassuring
- India-first, but not overly local so it can scale later

The interface should reflect that the product is easy for a small shop, but capable enough for a growing business.

## Guiding product rule

If there is ever a conflict between:
- simplicity and complexity
- speed and extra features
- clarity and cleverness

Choose simplicity first.

Ezvento should always feel like: **easy on the surface, powerful underneath**.
