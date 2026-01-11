
export default function AppBackground({ subtle = true }: { subtle?: boolean }) {
    return (
        <div className={`absolute inset-0 z-0 pointer-events-none ${subtle ? 'opacity-40' : 'opacity-100'}`}>
            <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] animate-pulse-glow" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
        </div>
    );
}
