export type TaskPriority = "high" | "medium" | "low";

export interface BrainDumpRequest {
  input_text: string;
}

export interface ExtractedTask {
  id: string;
  title: string;
  category: string;
  estimated_minutes: number;
  priority: TaskPriority;
  priority_reason: string;
  micro_step: string;
}

export interface BrainDumpResponse {
  summary: string;
  tasks: ExtractedTask[];
}

export const MOCK_BRAIN_DUMP_RESPONSE: BrainDumpResponse = {
  summary: "Ada 3 tugas terdeteksi. Mulai dari langkah paling ringan selama 5 menit agar tidak terasa berat.",
  tasks: [
    {
      id: "task-1",
      title: "Laporan Praktikum Basis Data",
      category: "Kuliah",
      estimated_minutes: 60,
      priority: "high",
      priority_reason: "Tenggat waktu paling dekat dan memiliki bobot penilaian praktikum.",
      micro_step: "Buka file dokumen laporan dan tulis bagian Judul serta Tujuan dalam 5 menit."
    },
    {
      id: "task-2",
      title: "Latihan Soal Kuis Aljabar Linear",
      category: "Belajar",
      estimated_minutes: 45,
      priority: "high",
      priority_reason: "Kuis dilaksanakan besok pagi sehingga perlu pemanasan materi malam ini.",
      micro_step: "Siapkan kertas coretan dan kerjakan 1 contoh soal matriks paling dasar."
    },
    {
      id: "task-3",
      title: "Rapikan Meja Belajar & Buang Sampah",
      category: "Pribadi",
      estimated_minutes: 15,
      priority: "low",
      priority_reason: "Bisa dikerjakan setelah tugas kuliah utama selesai untuk menyegarkan pikiran.",
      micro_step: "Ambil kantong plastik dan buang botol atau kertas bekas di atas meja sekarang."
    }
  ]
};