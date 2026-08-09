import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { InvoiceEntity } from '@/lib/clientOrder';
import { SELLER_CONFIG, formatCurrencyAmount } from '@/lib/invoicing';
import { getPdfTheme } from './pdfTheme';
import { PdfBrandHeader } from './PdfBrandHeader';
import { PdfFooter } from './PdfFooter';

interface InvoicePDFProps {
  invoice: InvoiceEntity;
  isNoir?: boolean;
}

export function InvoicePDF({ invoice, isNoir = false }: InvoicePDFProps) {
  const theme = getPdfTheme(isNoir);
  const currency = invoice.currency || 'INR';

  const isGst = Boolean(invoice.is_gst);
  const lineItems = invoice.line_items || [];
  const taxBreakup = invoice.tax_breakup || { total_tax: 0, is_interstate: false };
  const billing = invoice.billing_address || {};
  const shipping = invoice.shipping_address || billing;
  const placeOfSupply = invoice.place_of_supply || shipping.state || billing.state || SELLER_CONFIG.address.state;

  const styles = StyleSheet.create({
    page: {
      backgroundColor: theme.pageBg,
      paddingTop: 28,
      paddingBottom: 40,
      paddingHorizontal: 36,
      fontFamily: theme.bodyFont,
      fontSize: 9,
      color: theme.textPrimary,
    },
    section: {
      marginBottom: 12,
    },
    flexRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    colHalf: {
      width: '48%',
    },
    card: {
      backgroundColor: theme.cardBg,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: 4,
      padding: 10,
      marginBottom: 10,
    },
    cardTitle: {
      fontFamily: theme.headlineBoldFont,
      fontSize: 10,
      color: theme.accentColor,
      marginBottom: 6,
      textTransform: 'uppercase',
    },
    metaLabel: {
      fontFamily: theme.labelBoldFont,
      color: theme.textSecondary,
      fontSize: 8,
    },
    metaValue: {
      fontFamily: theme.bodyFont,
      fontSize: 9,
      color: theme.textPrimary,
      marginBottom: 3,
    },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: invoice.payment_status === 'paid' ? '#10B981' : '#F59E0B',
      color: '#FFFFFF',
      fontSize: 8,
      fontFamily: theme.labelBoldFont,
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: 3,
      marginTop: 4,
    },
    table: {
      width: '100%',
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 12,
    },
    tableHeaderRow: {
      flexDirection: 'row',
      backgroundColor: theme.headerBg,
      paddingVertical: 6,
      paddingHorizontal: 8,
    },
    tableHeaderCell: {
      fontFamily: theme.labelBoldFont,
      color: theme.headerTitle,
      fontSize: 8,
      textTransform: 'uppercase',
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
      paddingVertical: 6,
      paddingHorizontal: 8,
      alignItems: 'center',
    },
    tableRowAlt: {
      backgroundColor: theme.tableRowAlt,
    },
    colDesc: { width: '38%' },
    colSac: { width: '12%', textAlign: 'center' },
    colQty: { width: '8%', textAlign: 'center' },
    colRate: { width: '14%', textAlign: 'right' },
    colTax: { width: '12%', textAlign: 'right' },
    colTotal: { width: '16%', textAlign: 'right' },
    summaryContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: 12,
    },
    summaryBox: {
      width: '45%',
      backgroundColor: theme.cardBg,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: 4,
      padding: 10,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 3,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.cardBorder,
    },
    summaryTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 6,
      marginTop: 4,
      borderTopWidth: 1.5,
      borderTopColor: theme.accentColor,
    },
    summaryTotalText: {
      fontFamily: theme.headlineBoldFont,
      fontSize: 11,
      color: theme.accentColor,
    },
    notesTitle: {
      fontFamily: theme.labelBoldFont,
      fontSize: 9,
      color: theme.textPrimary,
      marginBottom: 3,
    },
    notesBody: {
      fontFamily: theme.bodyFont,
      fontSize: 8,
      color: theme.textSecondary,
      lineHeight: 1.3,
    },
  });

  return (
    <Document title={`Invoice ${invoice.invoice_number} - Prateeq Studio`}>
      <Page size="A4" style={styles.page}>
        <PdfBrandHeader
          theme={theme}
          title={isGst ? 'TAX INVOICE' : 'COMMERCIAL INVOICE'}
          subtitle={`Ref: ${invoice.invoice_number} | Currency: ${currency}`}
        />

        {/* Invoice Metadata & Seller Info */}
        <View style={[styles.flexRow, styles.section]}>
          <View style={[styles.colHalf, styles.card]}>
            <Text style={styles.cardTitle}>Invoice Details</Text>
            <Text style={styles.metaLabel}>Invoice Number:</Text>
            <Text style={styles.metaValue}>{invoice.invoice_number}</Text>

            <Text style={styles.metaLabel}>Issue Date:</Text>
            <Text style={styles.metaValue}>
              {invoice.issue_date
                ? new Date(invoice.issue_date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : new Date(invoice.created_at).toLocaleDateString()}
            </Text>

            <Text style={styles.metaLabel}>Due / Expiry Date:</Text>
            <Text style={styles.metaValue}>
              {invoice.expiry_date || invoice.due_date
                ? new Date(invoice.expiry_date || invoice.due_date!).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Due Upon Receipt'}
            </Text>

            <View style={styles.badge}>
              <Text>{(invoice.payment_status || 'PENDING').toUpperCase()}</Text>
            </View>
          </View>

          <View style={[styles.colHalf, styles.card]}>
            <Text style={styles.cardTitle}>Seller / Supplier</Text>
            <Text style={styles.metaValue}>{SELLER_CONFIG.company}</Text>
            <Text style={styles.metaValue}>{SELLER_CONFIG.name}</Text>
            <Text style={styles.metaValue}>
              {SELLER_CONFIG.address.street}, {SELLER_CONFIG.address.city},{' '}
              {SELLER_CONFIG.address.state} - {SELLER_CONFIG.address.pincode}
            </Text>
            <Text style={styles.metaValue}>Email: {SELLER_CONFIG.email}</Text>
            {isGst && <Text style={styles.metaValue}>GSTIN: {SELLER_CONFIG.gstin}</Text>}
          </View>
        </View>

        {/* Customer Billing & Shipping Info */}
        <View style={[styles.flexRow, styles.section]}>
          <View style={[styles.colHalf, styles.card]}>
            <Text style={styles.cardTitle}>Billed To</Text>
            <Text style={styles.metaValue}>{invoice.customer_name || 'Valued Client'}</Text>
            <Text style={styles.metaValue}>Email: {invoice.customer_email || 'N/A'}</Text>
            {invoice.customer_phone && <Text style={styles.metaValue}>Phone: {invoice.customer_phone}</Text>}
            {invoice.customer_gstin && <Text style={styles.metaValue}>GSTIN: {invoice.customer_gstin}</Text>}
            {billing.street && (
              <Text style={styles.metaValue}>
                {billing.street}, {billing.city}, {billing.state} {billing.pincode}
              </Text>
            )}
          </View>

          <View style={[styles.colHalf, styles.card]}>
            <Text style={styles.cardTitle}>Place of Supply & Delivery</Text>
            <Text style={styles.metaValue}>Place of Supply: {placeOfSupply}</Text>
            {shipping.street ? (
              <Text style={styles.metaValue}>
                Shipping: {shipping.street}, {shipping.city}, {shipping.state} {shipping.pincode}
              </Text>
            ) : (
              <Text style={styles.metaValue}>Digital Electronic Delivery (Remote Software Services)</Text>
            )}
            <Text style={styles.metaValue}>Tax Treatment: {isGst ? (taxBreakup.is_interstate ? 'IGST (Inter-State)' : 'CGST + SGST (Intra-State)') : 'Non-GST / Exempt (International)'}</Text>
          </View>
        </View>

        {/* Itemized Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Item Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colSac]}>SAC / HSN</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colRate]}>Rate ({currency})</Text>
            <Text style={[styles.tableHeaderCell, styles.colTax]}>Tax ({currency})</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total ({currency})</Text>
          </View>

          {lineItems.map((item, idx) => (
            <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
              <View style={styles.colDesc}>
                <Text style={{ fontFamily: theme.labelBoldFont, fontSize: 9 }}>{item.name}</Text>
                {item.description ? <Text style={{ color: theme.textSecondary, fontSize: 8 }}>{item.description}</Text> : null}
              </View>
              <Text style={[styles.metaValue, styles.colSac]}>{item.sac_hsn || '-'}</Text>
              <Text style={[styles.metaValue, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.metaValue, styles.colRate]}>{formatCurrencyAmount(item.rate, currency)}</Text>
              <Text style={[styles.metaValue, styles.colTax]}>{formatCurrencyAmount(item.tax_amount, currency)}</Text>
              <Text style={[styles.metaValue, styles.colTotal]}>{formatCurrencyAmount(item.total, currency)}</Text>
            </View>
          ))}
        </View>

        {/* Summary & Tax Breakup Box */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.metaLabel}>Subtotal:</Text>
              <Text style={styles.metaValue}>
                {formatCurrencyAmount(
                  lineItems.reduce((acc, item) => acc + item.subtotal, 0) || invoice.amount,
                  currency
                )}
              </Text>
            </View>

            {isGst && taxBreakup.cgst_amount ? (
              <>
                <View style={styles.summaryRow}>
                  <Text style={styles.metaLabel}>CGST ({taxBreakup.cgst_rate}%):</Text>
                  <Text style={styles.metaValue}>{formatCurrencyAmount(taxBreakup.cgst_amount || 0, currency)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.metaLabel}>SGST ({taxBreakup.sgst_rate}%):</Text>
                  <Text style={styles.metaValue}>{formatCurrencyAmount(taxBreakup.sgst_amount || 0, currency)}</Text>
                </View>
              </>
            ) : null}

            {isGst && taxBreakup.igst_amount ? (
              <View style={styles.summaryRow}>
                <Text style={styles.metaLabel}>IGST ({taxBreakup.igst_rate}%):</Text>
                <Text style={styles.metaValue}>{formatCurrencyAmount(taxBreakup.igst_amount || 0, currency)}</Text>
              </View>
            ) : null}

            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryTotalText}>Grand Total:</Text>
              <Text style={styles.summaryTotalText}>{formatCurrencyAmount(invoice.amount, currency)}</Text>
            </View>
          </View>
        </View>

        {/* Notes & Terms */}
        {invoice.customer_notes ? (
          <View style={[styles.card, styles.section]}>
            <Text style={styles.notesTitle}>Customer Notes</Text>
            <Text style={styles.notesBody}>{invoice.customer_notes}</Text>
          </View>
        ) : null}

        {invoice.terms_and_conditions ? (
          <View style={[styles.card, styles.section]}>
            <Text style={styles.notesTitle}>Terms & Conditions</Text>
            <Text style={styles.notesBody}>{invoice.terms_and_conditions}</Text>
          </View>
        ) : null}

        <PdfFooter theme={theme} leftText="GST & Commercial Invoice" />
      </Page>
    </Document>
  );
}
