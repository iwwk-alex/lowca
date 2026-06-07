import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS so that our frontend on port 4300 can access backend APIs
  app.enableCors();
  
  // Set global prefix for API endpoints
  app.setGlobalPrefix('api');
  
  await app.listen(3000);
  console.log('NestJS Backend is running on: http://localhost:3000/api');
}
bootstrap();
