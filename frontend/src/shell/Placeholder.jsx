// Shown for a module that has not been plugged into the shell yet.
export default function Placeholder({ title, owner, contract }) {
  return (
    <section className="placeholder">
      <h1>{title}</h1>
      <p className="notice" role="status">
        This module is in progress ({owner}) and not yet connected to the shell.
      </p>
      {contract && (
        <p>
          <strong>Data it will use:</strong> <code>{contract}</code>
        </p>
      )}
    </section>
  );
}
