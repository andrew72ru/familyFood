<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Dto\{OpenAiResponseDto, UsageDto};
use App\Service\OpenAiService;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;
use Symfony\Component\Serializer\SerializerInterface;

class OpenAiServiceTest extends KernelTestCase
{
    public function testGetRecipeForDish(): void
    {
        self::bootKernel();
        $container = self::getContainer();

        $mockResponseData = [
            'id' => 'resp_123',
            'object' => 'response',
            'created_at' => 1234567890,
            'status' => 'completed',
            'output' => [
                [
                    'id' => 'msg_123',
                    'type' => 'message',
                    'role' => 'assistant',
                    'status' => 'completed',
                    'content' => [
                        [
                            'type' => 'output_text',
                            'text' => "Рецепт традиционного борща:\n\nИнгредиенты: ...",
                        ],
                    ],
                ],
            ],
            'usage' => [
                'total_tokens' => 100,
                'input_tokens' => 40,
                'output_tokens' => 60,
            ],
        ];

        $jsonContent = \json_encode($mockResponseData);
        $this->assertIsString($jsonContent);
        $mockResponse = new MockResponse($jsonContent, [
            'http_code' => 200,
            'response_headers' => ['content-type' => 'application/json'],
        ]);

        $httpClient = new MockHttpClient($mockResponse);
        $serializer = $container->get(SerializerInterface::class);
        $this->assertInstanceOf(SerializerInterface::class, $serializer);
        $logger = $this->createMock(LoggerInterface::class);
        $logger->expects($this->atLeastOnce())->method('info');

        $service = new OpenAiService(
            $httpClient,
            $serializer,
            $logger,
            'test_api_key',
            'pmpt_TEST',
            '2'
        );

        $responseDto = $service->getRecipeForDish('Борщ');

        $this->assertInstanceOf(OpenAiResponseDto::class, $responseDto);
        $this->assertEquals("Рецепт традиционного борща:\n\nИнгредиенты: ...", $responseDto->getFirstMessageText());
        $this->assertEquals('resp_123', $responseDto->getId());
        $usage = $responseDto->getUsage();
        $this->assertInstanceOf(UsageDto::class, $usage);
        $this->assertEquals(100, $usage->getTotalTokens());

        $this->assertEquals('POST', $mockResponse->getRequestMethod());
        $this->assertEquals('https://api.openai.com/v1/responses', $mockResponse->getRequestUrl());

        $requestOptions = $mockResponse->getRequestOptions();
        $this->assertStringContainsString('Bearer test_api_key', $requestOptions['headers'][0]);

        $body = \json_decode($requestOptions['body'], true);
        $this->assertEquals('gpt-4.1-mini', $body['model']);
        $this->assertEquals('pmpt_TEST', $body['prompt']['id']);
        $this->assertEquals('2', $body['prompt']['version']);
        $this->assertEquals('Борщ', $body['prompt']['variables']['dish']);
    }
}
