const canvas = document.createElement('canvas'); // document.getElementById('backgroundCanvas');
canvas.id = 'backgroundCanvas';
document.body.appendChild(canvas);

const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Parametri
const points = [];
const pointCount = 40; // pochi nodi per leggerezza
const maxDistance = 180;

// Genera punti casuali
for (let i = 0; i < pointCount; i++) {
    points.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: 2 + Math.random() * 2
    });
}

window.addEventListener('resize', () => {
    const oldWidth = canvas.width;
    const oldHeight = canvas.height;
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    points.forEach(p => {
        p.x = p.x / oldWidth * newWidth;
        p.y = p.y / oldHeight * newHeight;
    });

    canvas.width = newWidth;
    canvas.height = newHeight;
});

// Mouse hover
const mouse = { x: null, y: null };
canvas.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});
canvas.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
});

// Animazione
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const neonColor = getComputedStyle(document.body).getPropertyValue('--color-background-canvas') || 'rgba(0,255,255,0.8)';

    // Disegna linee tra punti vicini
    for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        for (let j = i + 1; j < points.length; j++) {
            const p2 = points[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if(dist < maxDistance){
                 const alpha = 1 - dist/maxDistance;
                // usa rgba della variabile neon
                const rgbaMatch = neonColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
                let strokeColor = neonColor;
                if(rgbaMatch){
                    const r = rgbaMatch[1], g = rgbaMatch[2], b = rgbaMatch[3];
                    strokeColor = `rgba(${r},${g},${b},${alpha})`;
                }
                ctx.strokeStyle = strokeColor;
                // ctx.strokeStyle = `rgba(0,255,255,${1 - dist/maxDistance})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    }

    // Disegna nodi e muovili
    points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
        // ctx.fillStyle = 'rgba(0,255,255,0.8)';
        ctx.fillStyle = neonColor;
        ctx.fill();

        // Movimento base
        p.x += p.vx;
        p.y += p.vy;

        if(p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if(p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Interazione mouse (hover)
        if(mouse.x !== null && mouse.y !== null){
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if(dist < 100){ // distanza di influenza
                p.x += dx / 30;
                p.y += dy / 30;
            }
        }
    });

    requestAnimationFrame(animate);
}

animate();

