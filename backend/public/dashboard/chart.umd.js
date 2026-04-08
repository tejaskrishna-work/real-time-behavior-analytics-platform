(function (global) {
  class Chart {
    constructor(canvas, config) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.config = config;
      this.draw();
    }

    clear() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    resizeCanvas() {
      const rect = this.canvas.getBoundingClientRect();
      this.canvas.width = rect.width || 600;
      this.canvas.height = rect.height || 280;
    }

    drawAxes(padding, width, height) {
      const ctx = this.ctx;
      ctx.beginPath();
      ctx.moveTo(padding, 10);
      ctx.lineTo(padding, height - padding);
      ctx.lineTo(width - 10, height - padding);
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    drawLine(labels, values, label) {
      const ctx = this.ctx;
      const width = this.canvas.width;
      const height = this.canvas.height;
      const padding = 40;
      const maxValue = Math.max(...values, 1);

      this.drawAxes(padding, width, height);

      const stepX =
        labels.length > 1
          ? (width - padding * 2) / (labels.length - 1)
          : width / 2;

      ctx.beginPath();
      values.forEach((v, i) => {
        const x = labels.length > 1 ? padding + i * stepX : width / 2;
        const y = height - padding - (v / maxValue) * (height - padding * 2);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 3;
      ctx.stroke();

      values.forEach((v, i) => {
        const x = labels.length > 1 ? padding + i * stepX : width / 2;
        const y = height - padding - (v / maxValue) * (height - padding * 2);

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#2563eb";
        ctx.fill();
      });

      ctx.fillStyle = "#111827";
      ctx.font = "12px Arial";
      ctx.fillText(label, padding, 20);
    }

    drawBar(labels, values, label) {
      const ctx = this.ctx;
      const width = this.canvas.width;
      const height = this.canvas.height;
      const padding = 40;
      const maxValue = Math.max(...values, 1);

      this.drawAxes(padding, width, height);

      const gap = 16;
      const totalBarArea = width - padding * 2;
      const barWidth = Math.max(
        20,
        (totalBarArea - gap * (values.length - 1)) / Math.max(values.length, 1)
      );

      values.forEach((v, i) => {
        const x = padding + i * (barWidth + gap);
        const barHeight = (v / maxValue) * (height - padding * 2);
        const y = height - padding - barHeight;

        ctx.fillStyle = "#2563eb";
        ctx.fillRect(x, y, barWidth, barHeight);

        ctx.fillStyle = "#111827";
        ctx.font = "11px Arial";
        ctx.fillText(String(v), x, y - 6);
      });

      ctx.fillStyle = "#111827";
      ctx.font = "12px Arial";
      ctx.fillText(label, padding, 20);
    }

    draw() {
      this.resizeCanvas();
      this.clear();

      const { type, data } = this.config;
      const labels = data.labels || [];
      const values = (data.datasets && data.datasets[0] && data.datasets[0].data) || [];
      const label =
        (data.datasets && data.datasets[0] && data.datasets[0].label) || "";

      if (!labels.length || !values.length) return;

      if (type === "line") {
        this.drawLine(labels, values, label);
      } else if (type === "bar") {
        this.drawBar(labels, values, label);
      }
    }

    destroy() {
      this.clear();
    }
  }

  global.Chart = Chart;
})(window);