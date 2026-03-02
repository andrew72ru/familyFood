<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\ExtractIngredients;
use PHPUnit\Framework\Attributes\DataProvider;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;
use Symfony\Component\Serializer\SerializerInterface;

class ExtractIngredientsTest extends KernelTestCase
{
    public function testExtractIngredientsSuccess(): void
    {
        self::bootKernel();
        $container = self::getContainer();

        $jsonContent = \file_get_contents(__DIR__ . '/../_data/extract-ingredients.json');
        $this->assertIsString($jsonContent);

        $mockResponse = new MockResponse($jsonContent, [
            'http_code' => 200,
            'response_headers' => ['content-type' => 'application/json'],
        ]);

        $httpClient = new MockHttpClient($mockResponse);
        $serializer = $container->get(SerializerInterface::class);
        $this->assertInstanceOf(SerializerInterface::class, $serializer);
        $logger = $this->createStub(LoggerInterface::class);

        $service = new ExtractIngredients(
            $httpClient,
            $serializer,
            $logger,
            'test_api_key',
            'pmpt_EXTRACT',
            '1'
        );

        $ingredients = $service->extract('Test recipe text');

        $this->assertIsArray($ingredients);
        $this->assertCount(10, $ingredients);
        $this->assertEquals('мясной фарш (свинина + говядина)', $ingredients[0]);
        $this->assertEquals('лук', $ingredients[1]);
        $this->assertEquals('растительное масло', $ingredients[9]);

        $this->assertEquals('POST', $mockResponse->getRequestMethod());
        $this->assertEquals('https://api.openai.com/v1/responses', $mockResponse->getRequestUrl());

        $requestOptions = $mockResponse->getRequestOptions();
        $body = \json_decode($requestOptions['body'], true);
        $this->assertEquals('Test recipe text', $body['prompt']['variables']['dish']);
    }

    #[DataProvider('provideInvalidJsonResponse')]
    public function testExtractIngredientsInvalidJson(string $invalidInnerJson): void
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
                            'text' => $invalidInnerJson,
                        ],
                    ],
                ],
            ],
        ];

        $mockResponse = new MockResponse(\json_encode($mockResponseData), [
            'http_code' => 200,
            'response_headers' => ['content-type' => 'application/json'],
        ]);

        $httpClient = new MockHttpClient($mockResponse);
        $serializer = $container->get(SerializerInterface::class);
        $this->assertInstanceOf(SerializerInterface::class, $serializer);
        $logger = $this->createMock(LoggerInterface::class);
        $logger->expects($this->once())->method('error')->with($this->stringContains('Unable to deserialize a response'));

        $service = new ExtractIngredients(
            $httpClient,
            $serializer,
            $logger,
            'test_api_key',
            'pmpt_EXTRACT',
            '1'
        );

        $ingredients = $service->extract('Test recipe text');

        $this->assertIsArray($ingredients);
        $this->assertEmpty($ingredients);
    }

    public static function provideInvalidJsonResponse(): iterable
    {
        yield 'not a json' => ['This is not a JSON at all'];
        yield 'invalid json format' => ['["ingredient1", "ingredient2"']; // Missing closing bracket
        yield 'json object instead of array' => ['{"ingredients": ["item1"]}'];
    }
}
