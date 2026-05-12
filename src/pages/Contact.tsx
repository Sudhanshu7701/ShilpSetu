import StaticPage from "@/components/StaticPage";

const Contact = () => (
  <StaticPage title="Contact Us" subtitle="We'd love to hear from you.">
    <h2>Get in Touch</h2>
    <p>Have a question, suggestion, or partnership inquiry? Reach out to us:</p>
    <ul>
      <li><strong>Email:</strong> support@loomlive.com</li>
      <li><strong>Business Inquiries:</strong> hello@loomlive.com</li>
      <li><strong>Response Time:</strong> Within 24 hours on business days</li>
    </ul>
    <h2>Office</h2>
    <p>LOOMLIVE Crafts Pvt. Ltd.<br />Varanasi, Uttar Pradesh, India</p>
    <h2>For Artisans</h2>
    <p>Interested in selling your crafts on LOOMLIVE? Visit our <a href="/artisan-program" className="text-primary hover:underline">Artisan Program</a> page to learn more.</p>
  </StaticPage>
);

export default Contact;
