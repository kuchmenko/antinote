import { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: ReactNode;
}

export default function PageHeader({ title, description, children }: PageHeaderProps) {
    return (
        <div className="w-full text-left mb-12 pl-4 border-l-2 border-white/20">
            <div className="flex justify-between items-start">
                <div className="flex flex-col">
                    <h2 className="text-3xl md:text-4xl font-light text-white/80 tracking-tight">
                        {title}
                    </h2>
                    {description && (
                        <p className="text-white/40 text-lg mt-1 font-light">
                            {description}
                        </p>
                    )}
                </div>
                {children}
            </div>
        </div>
    );
}
