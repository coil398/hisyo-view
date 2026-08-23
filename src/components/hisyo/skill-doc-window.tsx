import { mdToHtml, sanitizeHtml } from "@/lib/hisyo/md";
import { loadSkillDoc } from "@/lib/hisyo/sources";
import { useEffect, useState } from "react";

export function SkillDocWindow({ id, rel }: { id: string; rel: string }) {
  const [html, setHtml] = useState("");
  const [title, setTitle] = useState("スキル");
  const [frame, setFrame] = useState(false);

  useEffect(() => {
    let live = true;
    void (async () => {
      const doc = await loadSkillDoc(id, rel);
      if (!live || !doc) return;
      setTitle(doc.title);
      document.title = doc.title;
      if (doc.kind === "html" && /<html/i.test(doc.text)) {
        setFrame(true);
        setHtml(doc.html || doc.text);
      } else if (doc.kind === "html") {
        setFrame(false);
        setHtml(sanitizeHtml(doc.text));
      } else {
        setFrame(false);
        setHtml(mdToHtml(doc.text));
      }
    })();
    return () => {
      live = false;
    };
  }, [id, rel]);

  if (frame) {
    return <iframe title={title} sandbox="" srcDoc={html} className="h-dvh w-full bg-background" />;
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border px-5 py-3">
        <p className="text-sm font-medium">{title}</p>
      </header>
      <article className="skill-prose mx-auto max-w-2xl px-6 py-6" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
