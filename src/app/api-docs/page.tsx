
'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

import { swaggerSpec } from '@/lib/swagger';

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-white p-4 md:p-8">
      <SwaggerUI spec={swaggerSpec} />
    </main>
  );
}
