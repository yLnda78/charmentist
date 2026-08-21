const express = require('express');
const { body, validationResult } = require('express-validator');
const midtransClient = require('midtrans-client');
const db = require('../db');
const { optionalAuth, requireAuth } = require('../middleware/auth');
const { sendMail } = require('../utils/mail');
const { getUsdToIdrRate } = require('../utils/fx');

const router = express.Router();

const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});


/* ============================================================
   ORDER NUMBER
============================================================ */

function generateOrderNumber() {
  const date = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '');

  const rand =
    Math.floor(Math.random() * 9000 + 1000);

  return `CHM-${date}-${rand}`;
}


/* ============================================================
   SHIPPING
   ------------------------------------------------------------
   IMPORTANT:
   These are backend-controlled prices.
   Never trust shippingCost sent by the browser.
============================================================ */

const DELIVERY_OPTIONS = {

  domestic: [

    {
      id: 'domestic-standard',
      label: 'Standard Delivery (3–5 business days)',
      cost: 0
    },

    {
      id: 'domestic-express',
      label: 'Express Delivery (1–2 business days)',
      cost: 8
    },

    {
      id: 'domestic-premium',
      label: 'Premium Delivery (Same day)',
      cost: 18
    }

  ],

  international: [

    {
      id: 'international-standard',
      label: 'Standard International (7–14 business days)',
      cost: 60
    },

    {
      id: 'international-express',
      label: 'Express International (3–5 business days)',
      cost: 110
    },

    {
      id: 'international-priority',
      label: 'Priority White-Glove (1–2 business days)',
      cost: 200
    }

  ]

};


/* ============================================================
   PAYMENT METHODS
   ------------------------------------------------------------
   Backend keeps a controlled list so the browser cannot invent
   arbitrary payment methods.
============================================================ */

const PAYMENT_METHODS = {

  domestic: [
    'card',
    'bank-transfer-domestic',
    'qris',
    'invoice'
  ],

  international: [
    'card',
    'wire-transfer',
    'paypal',
    'escrow',
    'invoice'
  ]

};


/* ============================================================
   COUNTRY / CURRENCY
============================================================ */

const COUNTRY_CURRENCIES = {

  Australia: 'AUD',
  Canada: 'CAD',
  Denmark: 'DKK',

  France: 'EUR',
  Germany: 'EUR',
  Italy: 'EUR',
  Netherlands: 'EUR',

  'Hong Kong': 'HKD',

  Indonesia: 'IDR',

  Japan: 'JPY',

  'New Zealand': 'NZD',
  Norway: 'NOK',

  Qatar: 'QAR',
  'Saudi Arabia': 'SAR',

  Singapore: 'SGD',

  'South Korea': 'KRW',

  Sweden: 'SEK',
  Switzerland: 'CHF',

  'United Arab Emirates': 'AED',

  'United Kingdom': 'GBP',

  'United States': 'USD'

};


/* ============================================================
   HELPERS
============================================================ */

function isDomesticCountry(country) {
  return country === 'Indonesia';
}


function getCurrencyForCountry(country) {
  return COUNTRY_CURRENCIES[country] || 'USD';
}


function findDeliveryOption(country, deliveryMethod) {

  const list =
    isDomesticCountry(country)
      ? DELIVERY_OPTIONS.domestic
      : DELIVERY_OPTIONS.international;

  return list.find(
    option => option.id === deliveryMethod
  );

}


function isValidPaymentMethod(country, paymentMethod) {

  const list =
    isDomesticCountry(country)
      ? PAYMENT_METHODS.domestic
      : PAYMENT_METHODS.international;

  return list.includes(paymentMethod);

}


/* ============================================================
   POST /api/orders
   ------------------------------------------------------------
   Guest checkout is allowed.
   Logged-in users are attached through optionalAuth.
============================================================ */

router.post(
  '/',
  optionalAuth,

  body('customerEmail')
    .isEmail()
    .withMessage('Enter a valid email address.'),

  body('customerName')
    .trim()
    .notEmpty()
    .withMessage('Name is required.'),

  body('shippingAddress')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Enter a complete shipping address.'),

  body('customerPhone')
    .optional({ checkFalsy: true })
    .matches(/^\+?[0-9][0-9\s-]{7,14}$/)
    .withMessage('Enter a valid phone number.'),

  async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: errors.array()[0].msg
      });
    }


    const {
      items,
      customerName,
      customerEmail,
      customerPhone,

      country,
      currency,

      shippingAddress,

      paymentMethod,
      paymentMethodLabel,

      deliveryMethod,
      deliveryMethodLabel,

      shippingCost
    } = req.body;


    /* ========================================================
       BASIC VALIDATION
    ======================================================== */

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Cart is empty.'
      });
    }


    if (!country) {
      return res.status(400).json({
        error: 'Country is required.'
      });
    }


    const expectedCurrency =
      getCurrencyForCountry(country);


    if (
      currency &&
      currency !== expectedCurrency
    ) {

      return res.status(400).json({
        error: 'Invalid checkout currency.'
      });

    }


    const finalCurrency =
      expectedCurrency;


    /* ========================================================
       DELIVERY VALIDATION
    ======================================================== */

    const delivery =
      findDeliveryOption(
        country,
        deliveryMethod
      );


    if (!delivery) {

      return res.status(400).json({
        error: 'Invalid delivery method.'
      });

    }


    /*
      Ignore shippingCost from the browser.

      The browser can display it,
      but backend decides the real amount.
    */

    const finalShippingCost =
      delivery.cost;


    /*
      Optional label from frontend is not trusted.
      Backend generates its own canonical label.
    */

    const finalDeliveryMethodLabel =
      delivery.label;


    /* ========================================================
       PAYMENT VALIDATION
    ======================================================== */

    if (
      !paymentMethod ||
      !isValidPaymentMethod(
        country,
        paymentMethod
      )
    ) {

      return res.status(400).json({
        error: 'Invalid payment method.'
      });

    }


    /*
      Payment label is also generated from
      a controlled list rather than trusting
      arbitrary text from the browser.
    */

    const PAYMENT_LABELS = {

      card:
        'Credit / Debit Card',

      'bank-transfer-domestic':
        'Bank Transfer',

      qris:
        'QRIS',

      'wire-transfer':
        'International Bank Wire (SWIFT)',

      paypal:
        'PayPal',

      escrow:
        'Escrow Service',

      invoice:
        'Pay via Invoice'

    };


    const finalPaymentMethodLabel =
      PAYMENT_LABELS[paymentMethod];


    /* ========================================================
       PRODUCTS
       --------------------------------------------------------
       NEVER trust product prices from the browser.
       Database remains the source of truth.
    ======================================================== */

    const orderItems = [];

    let subtotal = 0;


    for (const item of items) {

      const product =
        db.prepare(
          `
          SELECT *
          FROM products
          WHERE id = ?
            AND is_active = 1
          `
        ).get(item.productId);


      if (!product) {

        return res.status(400).json({
          error:
            `Product ${item.productId} is no longer available.`
        });

      }


      const qty =
        Math.max(
          1,
          parseInt(item.qty, 10) || 1
        );


      if (product.stock < qty) {

        return res.status(400).json({
          error:
            `Only ${product.stock} left of "${product.name}".`
        });

      }


      orderItems.push({

        id:
          product.id,

        name:
          product.name,

        price:
          product.price,

        qty,

        size:
          item.size || null

      });


      subtotal +=
        product.price * qty;

    }


    /* ========================================================
       TOTAL
    ======================================================== */

    const tax = 0;

    const total =
      subtotal +
      tax +
      finalShippingCost;


    const orderNumber =
      generateOrderNumber();


    /* ========================================================
       SAVE ORDER
       --------------------------------------------------------
       This requires the orders table to contain the new
       columns listed below.
    ======================================================== */

    const info =
      db.prepare(
        `
        INSERT INTO orders (

          order_number,
          user_id,

          customer_name,
          customer_email,
          customer_phone,

          country,
          currency,

          shipping_address,

          payment_method,
          payment_method_label,

          delivery_method,
          delivery_method_label,

          items_json,

          subtotal,
          shipping_fee,
          total

        )

        VALUES (

          ?,
          ?,

          ?,
          ?,
          ?,

          ?,
          ?,

          ?,

          ?,
          ?,

          ?,
          ?,

          ?,

          ?,
          ?,
          ?

        )
        `
      ).run(

        orderNumber,

        req.user
          ? req.user.id
          : null,

        customerName,
        customerEmail,
        customerPhone || '',

        country,
        finalCurrency,

        shippingAddress,

        paymentMethod,
        finalPaymentMethodLabel,

        deliveryMethod,
        finalDeliveryMethodLabel,

        JSON.stringify(orderItems),

        subtotal,
        finalShippingCost,
        total

      );


    const orderId =
      info.lastInsertRowid;


    /* ========================================================
       MIDTRANS
       --------------------------------------------------------
       Only create a Snap transaction for payment methods
       that actually use Midtrans.
    ======================================================== */

    let snapToken = null;
    let redirectUrl = null;


    const midtransPaymentMethods = [
      'card',
      'qris'
    ];


    if (
      midtransPaymentMethods.includes(
        paymentMethod
      )
    ) {

      try {

        /*
          Midtrans only accepts IDR, as a whole number with no decimals.
          The product database (and therefore `total`/`subtotal`/item
          prices computed above) is in USD, so everything sent to
          Midtrans has to be converted using a live USD -> IDR rate —
          never sent as raw USD numbers, which would charge a wildly
          wrong amount.

          Item-level prices are converted and rounded individually,
          then any rounding gap versus the overall gross_amount is
          folded into the last line item so Midtrans's line-item sum
          always matches gross_amount exactly.
        */

        const idrRate =
          await getUsdToIdrRate();

        const grossAmountIdr =
          Math.round(total * idrRate);

        const idrLineItems = [

          ...orderItems.map(i => ({
            id: i.id,
            name: i.name.slice(0, 50),
            price: Math.round(i.price * idrRate),
            quantity: i.qty
          })),

          ...(finalShippingCost > 0
            ? [{
                id: deliveryMethod,
                name: finalDeliveryMethodLabel,
                price: Math.round(finalShippingCost * idrRate),
                quantity: 1
              }]
            : [])

        ];

        const lineItemSum =
          idrLineItems.reduce(
            (sum, i) => sum + i.price * i.quantity,
            0
          );

        const roundingGap =
          grossAmountIdr - lineItemSum;

        if (roundingGap !== 0 && idrLineItems.length > 0) {
          const last = idrLineItems[idrLineItems.length - 1];
          last.price += Math.round(roundingGap / last.quantity);
        }

        const transaction =
          await snap.createTransaction({

            transaction_details: {

              order_id:
                orderNumber,

              gross_amount:
                grossAmountIdr

            },

            customer_details: {

              first_name:
                customerName,

              email:
                customerEmail,

              phone:
                customerPhone || ''

            },

            item_details:
              idrLineItems

          });


        snapToken =
          transaction.token;

        redirectUrl =
          transaction.redirect_url;


        db.prepare(
          `
          UPDATE orders
          SET
            midtrans_order_id = ?,
            midtrans_token = ?
          WHERE id = ?
          `
        ).run(

          orderNumber,
          snapToken,
          orderId

        );


      } catch (err) {

        console.error(
          'Midtrans transaction failed:',
          err.message
        );

        /*
          If we can't get a trustworthy IDR rate (or Midtrans itself
          fails), do NOT silently fall back to charging the raw USD
          number as IDR — that would undercharge by roughly 15,000x.
          The order is still saved as 'pending' with no snap token;
          the checkout page should show a "payment temporarily
          unavailable, please retry" state when snapToken is null.
        */

      }

    }


    /* ========================================================
       STOCK
       --------------------------------------------------------
       Existing behavior preserved.
    ======================================================== */

    const decrementStock =
      db.transaction((itemsToUpdate) => {

        for (const i of itemsToUpdate) {

          db.prepare(
            `
            UPDATE products
            SET stock = stock - ?
            WHERE id = ?
            `
          ).run(
            i.qty,
            i.id
          );

        }

      });


    decrementStock(orderItems);


    /* ========================================================
       EMAIL
    ======================================================== */

    sendMail({

      to:
        customerEmail,

      subject:
        `Order received — ${orderNumber}`,

      html: `

        <p>
          Thanks, ${customerName}!
        </p>

        <p>
          We've received your order
          <strong>${orderNumber}</strong>.
        </p>

        <p>
          Total:
          <strong>
            ${finalCurrency} ${total.toLocaleString('en-US')}
          </strong>
        </p>

        <p>
          Payment:
          ${finalPaymentMethodLabel}
        </p>

        <p>
          Delivery:
          ${finalDeliveryMethodLabel}
        </p>

      `

    }).catch(
      err =>
        console.error(
          'Order confirmation email failed:',
          err.message
        )
    );


    /* ========================================================
       RESPONSE
    ======================================================== */

    return res.status(201).json({

      order: {

        id:
          orderId,

        orderNumber,

        subtotal,

        shippingCost:
          finalShippingCost,

        total,

        currency:
          finalCurrency,

        paymentMethod,

        paymentMethodLabel:
          finalPaymentMethodLabel,

        deliveryMethod,

        deliveryMethodLabel:
          finalDeliveryMethodLabel,

        status:
          'pending'

      },

      payment: {

        snapToken,

        redirectUrl

      }

    });

  }
);


/* ============================================================
   GET /api/orders
   ------------------------------------------------------------
   Logged-in user's order history.
============================================================ */

router.get(
  '/',
  requireAuth,
  (req, res) => {

    const rows =
      db.prepare(
        `
        SELECT *
        FROM orders
        WHERE user_id = ?
        ORDER BY created_at DESC
        `
      ).all(req.user.id);


    res.json({

      orders:
        rows.map(o => ({

          ...o,

          items:
            JSON.parse(
              o.items_json
            )

        }))

    });

  }
);


/* ============================================================
   GET /api/orders/:orderNumber
============================================================ */

router.get(
  '/:orderNumber',
  (req, res) => {

    const row =
      db.prepare(
        `
        SELECT *
        FROM orders
        WHERE order_number = ?
        `
      ).get(
        req.params.orderNumber
      );


    if (!row) {

      return res.status(404).json({
        error: 'Order not found.'
      });

    }


    res.json({

      order: {

        ...row,

        items:
          JSON.parse(
            row.items_json
          )

      }

    });

  }
);


module.exports = router;
