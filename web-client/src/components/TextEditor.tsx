"use client";

import dynamic from "next/dynamic";

const Editor = dynamic(
    () =>
        import("@tinymce/tinymce-react").then(
            (mod) => mod.Editor
        ),
    { ssr: false }
);

type Props = {
    content: string;
    onChange?: (value: string) => void;
};

export default function TextEditor({
    content,
    onChange,
}: Props) {
    return (
        <Editor
            apiKey={
                process.env.NEXT_PUBLIC_TINYMCE_API_KEY || "qt11fipgmafclysfozbfinn5k4cneso9177j2z9v36uu2ovt"
            }
            value={content}
            onEditorChange={(newValue) => {
                onChange?.(newValue);
            }}
            init={{
                height: 500,

                plugins: [
                    "anchor",
                    "autolink",
                    "charmap",
                    "codesample",
                    "emoticons",
                    "link",
                    "lists",
                    "media",
                    "searchreplace",
                    "table",
                    "visualblocks",
                    "wordcount"
                ],

                toolbar:
                    "undo redo | bold italic underline | align | bullist numlist",

                tinycomments_mode: "embedded",
                tinycomments_author: "Author name",

                mergetags_list: [
                    {
                        value: "First.Name",
                        title: "First Name",
                    },
                    {
                        value: "Email",
                        title: "Email",
                    },
                ],

                uploadcare_public_key:
                    "1b8746eaf669d0808932",
            }}
        />
    );
}