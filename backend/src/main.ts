import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS so that our frontend on port 4300 can access backend APIs
  app.enableCors();
  
  // Set global prefix for API endpoints
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`NestJS Backend is running on port: ${port}`);
}
bootstrap();
