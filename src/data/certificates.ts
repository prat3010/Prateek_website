export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  date: string;
  credentialId?: string;
  verifyUrl?: string;
  image?: string;
  tags: string[];
}

export const certificates: Certificate[] = [
  {
    "id": "microsoft-excel---excel-from-beginner-to-advanced-3138",
    "title": "Microsoft Excel - Excel from Beginner to Advanced",
    "issuer": "Udemy",
    "date": "2025-04-05",
    "credentialId": "UC-d6f6c9d9-50cb-432b-8dcc-f63ade2b23ee",
    "verifyUrl": "https://www.udemy.com/certificate/UC-d6f6c9d9-50cb-432b-8dcc-f63ade2b23ee/",
    "image": "/certificates/microsoft-excel---excel-from-beginner-to-advanced-3138.jpg",
    "tags": [
      "excel",
      "spreadsheet",
      "data analysis",
      "microsoft office"
    ]
  }
];
