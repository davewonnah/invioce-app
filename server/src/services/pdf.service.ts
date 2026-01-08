import PDFDocument from 'pdfkit';

interface InvoiceData {
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  subtotal: any;
  taxRate: any;
  taxAmount: any;
  total: any;
  notes: string | null;
  client: {
    name: string;
    email: string;
    address: string | null;
    phone: string | null;
  };
  user: {
    name: string;
    companyName: string | null;
    address: string | null;
    email: string;
    phone: string | null;
  };
  items: Array<{
    description: string;
    quantity: any;
    unitPrice: any;
    total: any;
  }>;
}

export async function generateInvoicePdf(invoice: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'right' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(invoice.invoiceNumber, { align: 'right' });

      // Company Info (From)
      doc.moveDown(2);
      doc.fontSize(10).font('Helvetica-Bold').text('From:');
      doc.font('Helvetica');
      doc.text(invoice.user.companyName || invoice.user.name);
      if (invoice.user.address) doc.text(invoice.user.address);
      doc.text(invoice.user.email);
      if (invoice.user.phone) doc.text(invoice.user.phone);

      // Client Info (To)
      doc.moveDown(1);
      doc.font('Helvetica-Bold').text('Bill To:');
      doc.font('Helvetica');
      doc.text(invoice.client.name);
      doc.text(invoice.client.email);
      if (invoice.client.address) doc.text(invoice.client.address);
      if (invoice.client.phone) doc.text(invoice.client.phone);

      // Dates
      doc.moveDown(1);
      doc.text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`);
      doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`);

      // Items Table
      doc.moveDown(2);
      const tableTop = doc.y;
      const tableHeaders = ['Description', 'Qty', 'Unit Price', 'Total'];
      const columnWidths = [250, 60, 90, 90];
      let xPos = 50;

      // Table Header
      doc.font('Helvetica-Bold').fontSize(10);
      tableHeaders.forEach((header, i) => {
        doc.text(header, xPos, tableTop, { width: columnWidths[i], align: i === 0 ? 'left' : 'right' });
        xPos += columnWidths[i];
      });

      // Header line
      doc.moveTo(50, tableTop + 15).lineTo(540, tableTop + 15).stroke();

      // Table Rows
      doc.font('Helvetica').fontSize(10);
      let yPos = tableTop + 25;

      invoice.items.forEach((item) => {
        xPos = 50;
        doc.text(item.description, xPos, yPos, { width: columnWidths[0] });
        xPos += columnWidths[0];
        doc.text(String(Number(item.quantity)), xPos, yPos, { width: columnWidths[1], align: 'right' });
        xPos += columnWidths[1];
        doc.text(`$${Number(item.unitPrice).toFixed(2)}`, xPos, yPos, { width: columnWidths[2], align: 'right' });
        xPos += columnWidths[2];
        doc.text(`$${Number(item.total).toFixed(2)}`, xPos, yPos, { width: columnWidths[3], align: 'right' });
        yPos += 20;
      });

      // Totals
      yPos += 20;
      doc.moveTo(350, yPos - 10).lineTo(540, yPos - 10).stroke();

      doc.text('Subtotal:', 350, yPos, { width: 100, align: 'right' });
      doc.text(`$${Number(invoice.subtotal).toFixed(2)}`, 450, yPos, { width: 90, align: 'right' });
      yPos += 20;

      if (Number(invoice.taxRate) > 0) {
        doc.text(`Tax (${Number(invoice.taxRate)}%):`, 350, yPos, { width: 100, align: 'right' });
        doc.text(`$${Number(invoice.taxAmount).toFixed(2)}`, 450, yPos, { width: 90, align: 'right' });
        yPos += 20;
      }

      doc.font('Helvetica-Bold');
      doc.text('Total:', 350, yPos, { width: 100, align: 'right' });
      doc.text(`$${Number(invoice.total).toFixed(2)}`, 450, yPos, { width: 90, align: 'right' });

      // Notes
      if (invoice.notes) {
        doc.moveDown(3);
        doc.font('Helvetica-Bold').fontSize(10).text('Notes:');
        doc.font('Helvetica').text(invoice.notes);
      }

      // Footer
      doc.fontSize(8).text(
        'Thank you for your business!',
        50,
        doc.page.height - 50,
        { align: 'center' }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
