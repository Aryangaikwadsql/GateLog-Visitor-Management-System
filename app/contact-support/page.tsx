export default function ContactSupport() {
  return (
    <main className="min-h-screen flex flex-col max-w-4xl mx-auto p-6 bg-white rounded shadow mt-8 text-black">
      <h1 className="text-4xl font-extrabold mb-4">Contact Support</h1>
      <section className="mb-2 flex-grow">
        <p className="leading-relaxed text-lg">
          If you need assistance or have any questions regarding GateLog, please reach out to our support team. We are here to help you with any issues or inquiries.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-3xl font-semibold mb-3">Contact Information</h2>
        <p className="text-lg font-medium">
          For any questions or recommendations, please email us at{" "}
          <a href="mailto:testgatelog@gmail.com" className="text-indigo-600 hover:underline font-semibold">
            testgatelog@gmail.com
          </a>.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-3xl font-semibold mb-3">Feedback</h2>
        <p className="leading-relaxed text-lg">
          We welcome your feedback to help us improve GateLog. Please send your suggestions or report issues to the email above.
        </p>
      </section>
    </main>
  )
}
