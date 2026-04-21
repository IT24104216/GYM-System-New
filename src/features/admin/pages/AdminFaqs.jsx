import FaqManagerPage from '@/shared/components/faq/FaqManagerPage';

function AdminFaqs() {
  return (
    <FaqManagerPage
      role="admin"
      title="Admin FAQ Manager"
      subtitle="Create, edit, and delete FAQs shown to all users."
    />
  );
}

export default AdminFaqs;
